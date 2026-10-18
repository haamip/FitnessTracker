package nz.hakt.trackfit

import android.app.Activity
import android.content.Intent
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/**
 * Read-only daily steps, never background collection or health data writes.
 * User approval is requested via the OS Health Connect permission screen.
 */
@CapacitorPlugin(name = "TrackFitHealthConnect")
class TrackFitHealthConnectPlugin : Plugin() {
    private val job = SupervisorJob()
    private val scope = CoroutineScope(job + Dispatchers.IO)
    private val readSteps = HealthPermission.getReadPermission(StepsRecord::class)

    private fun available(): Boolean {
        return HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE
    }

    private fun client(): HealthConnectClient = HealthConnectClient.getOrCreate(context)

    private fun runAsync(call: PluginCall, block: suspend () -> JSObject) {
        scope.launch {
            try {
                val response = block()
                withContext(Dispatchers.Main) { call.resolve(response) }
            } catch (error: SecurityException) {
                withContext(Dispatchers.Main) {
                    call.reject("Health Connect permission was revoked.", "PERMISSION_REVOKED", error)
                }
            } catch (error: Exception) {
                withContext(Dispatchers.Main) {
                    call.reject("Health Connect couldn't read data: " + (error.message ?: "unknown error"), "HEALTH_CONNECT_FAILED", error)
                }
            }
        }
    }

    @PluginMethod
    fun getStatus(call: PluginCall) {
        if (!available()) {
            call.resolve(JSObject().put("available", false).put("stepsGranted", false))
            return
        }
        runAsync(call) {
            val granted = client().permissionController.getGrantedPermissions().contains(readSteps)
            JSObject().put("available", true).put("stepsGranted", granted)
        }
    }

    @PluginMethod
    override fun requestPermissions(call: PluginCall) {
        val types = call.getArray("dataTypes")
        if (types == null || types.length() != 1 || types.optString(0) != "steps") {
            call.reject("TrackFit currently requests read access to steps only.", "INVALID_SCOPE")
            return
        }
        if (!available()) {
            call.resolve(JSObject().put("stepsGranted", false))
            return
        }
        startActivityForResult(call, Intent(activity, HealthPermissionsActivity::class.java), "permissionResult")
    }

    @ActivityCallback
    private fun permissionResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        if (result.resultCode != Activity.RESULT_OK || !available()) {
            call.resolve(JSObject().put("stepsGranted", false))
            return
        }
        runAsync(call) {
            val granted = client().permissionController.getGrantedPermissions().contains(readSteps)
            JSObject().put("stepsGranted", granted)
        }
    }

    @PluginMethod
    fun readTodaySteps(call: PluginCall) {
        val requested = call.getString("date") ?: run {
            call.reject("Expected a local YYYY-MM-DD date.", "INVALID_DATE")
            return
        }
        val day = try { LocalDate.parse(requested) } catch (_: Exception) {
            call.reject("Expected a valid local YYYY-MM-DD date.", "INVALID_DATE")
            return
        }
        if (!available()) {
            call.reject("Health Connect is not available.", "UNAVAILABLE")
            return
        }
        runAsync(call) {
            val hc = client()
            if (!hc.permissionController.getGrantedPermissions().contains(readSteps)) {
                throw SecurityException("Steps read permission is not granted")
            }
            val zone = ZoneId.systemDefault()
            val from = day.atStartOfDay(zone).toInstant()
            val to = day.plusDays(1).atStartOfDay(zone).toInstant()
            val end = minOf(to, Instant.now())
            require(end.isAfter(from)) { "The requested day is in the future." }
            val aggregate = hc.aggregate(
                AggregateRequest(
                    metrics = setOf(StepsRecord.COUNT_TOTAL),
                    timeRangeFilter = TimeRangeFilter.between(from, end)
                )
            )
            val recordedSteps = aggregate[StepsRecord.COUNT_TOTAL]
            val steps = recordedSteps ?: 0L
            JSObject().put("date", requested)
                .put("steps", steps)
                .put("dataPresent", recordedSteps != null)
        }
    }

    override fun handleOnDestroy() {
        job.cancel()
        super.handleOnDestroy()
    }
}
