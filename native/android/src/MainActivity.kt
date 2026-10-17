package nz.hakt.trackfit

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(TrackFitHealthConnectPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
