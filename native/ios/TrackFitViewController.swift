import Capacitor

/// Native-only plugin registration for the existing React/Capacitor app.
class TrackFitViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(TrackFitHealthKitPlugin())
    }
}
