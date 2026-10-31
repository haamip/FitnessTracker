import Capacitor
import Foundation
import HealthKit

/// Read-only Apple Health step import. Apple never discloses read authorization
/// status, so "authorizationRequested" means the prompt was shown, NOT granted.
@objc(TrackFitHealthKitPlugin)
public class TrackFitHealthKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TrackFitHealthKitPlugin"
    public let jsName = "TrackFitHealthKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readTodaySteps", returnType: CAPPluginReturnPromise)
    ]

    private let store = HKHealthStore()
    private let requestedKey = "trackfit_healthkit_steps_authorization_requested"
    private var stepType: HKQuantityType { HKObjectType.quantityType(forIdentifier: .stepCount)! }

    @objc func getStatus(_ call: CAPPluginCall) {
        call.resolve([
            "available": HKHealthStore.isHealthDataAvailable(),
            "authorizationRequested": UserDefaults.standard.bool(forKey: requestedKey)
        ])
    }

    @objc func requestPermissions(_ call: CAPPluginCall) {
        guard let types = call.getArray("dataTypes") as? [String], types == ["steps"] else {
            call.reject("TrackFit only requests read access to steps.", "INVALID_SCOPE")
            return
        }
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("Apple Health is not available on this iPhone.", "UNAVAILABLE")
            return
        }
        store.requestAuthorization(toShare: [], read: [stepType]) { [weak self] _, error in
            DispatchQueue.main.async {
                if let error = error {
                    call.reject("Apple Health couldn't complete the permission request.", "HEALTHKIT_AUTH_FAILED", error)
                    return
                }
                if let self = self {
                    UserDefaults.standard.set(true, forKey: self.requestedKey)
                }
                // HealthKit deliberately does not report whether read access was
                // granted. A later query may return no data after denial.
                call.resolve(["authorizationRequested": true])
            }
        }
    }

    @objc func readTodaySteps(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("Apple Health is unavailable.", "UNAVAILABLE")
            return
        }
        guard let requested = call.getString("date"), requested.range(
            of: #"^\d{4}-\d{2}-\d{2}$"#, options: .regularExpression
        ) != nil else {
            call.reject("Expected a local YYYY-MM-DD date.", "INVALID_DATE")
            return
        }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .current
        let parts = requested.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3,
              let day = calendar.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2])),
              calendar.component(.year, from: day) == parts[0],
              calendar.component(.month, from: day) == parts[1],
              calendar.component(.day, from: day) == parts[2],
              let following = calendar.date(byAdding: .day, value: 1, to: day) else {
            call.reject("Invalid local date.", "INVALID_DATE")
            return
        }
        let until = min(following, Date())
        guard until > day else {
            call.reject("Cannot read a future day.", "INVALID_DATE")
            return
        }
        let predicate = HKQuery.predicateForSamples(withStart: day, end: until, options: [])
        let query = HKStatisticsQuery(quantityType: stepType,
                                      quantitySamplePredicate: predicate,
                                      options: .cumulativeSum) { _, statistics, error in
            DispatchQueue.main.async {
                if let error = error {
                    call.reject("Apple Health couldn't read steps.", "HEALTHKIT_READ_FAILED", error)
                    return
                }
                let quantity = statistics?.sumQuantity()
                let total = quantity?.doubleValue(for: HKUnit.count()) ?? 0
                guard total.isFinite, total >= 0, total <= 150000 else {
                    call.reject("Invalid Apple Health step total.", "INVALID_STEPS")
                    return
                }
                call.resolve([
                    "date": requested,
                    "steps": Int(total.rounded()),
                    "dataPresent": quantity != nil
                ])
            }
        }
        store.execute(query)
    }
}
