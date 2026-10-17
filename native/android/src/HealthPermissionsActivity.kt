package nz.hakt.trackfit

import android.app.Activity
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord

/**
 * Opens the official Health Connect permission chooser.
 * The launcher must be registered before onStart(), hence this Activity.
 */
class HealthPermissionsActivity : ComponentActivity() {
    private val readSteps = HealthPermission.getReadPermission(StepsRecord::class)
    private val requestSteps = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { granted ->
        setResult(if (granted.contains(readSteps)) Activity.RESULT_OK else Activity.RESULT_CANCELED)
        finish()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (savedInstanceState != null) return
        if (HealthConnectClient.getSdkStatus(this) != HealthConnectClient.SDK_AVAILABLE) {
            setResult(Activity.RESULT_CANCELED)
            finish()
            return
        }
        requestSteps.launch(setOf(readSteps))
    }
}
