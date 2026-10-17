package nz.hakt.trackfit

import android.app.Activity
import android.os.Bundle
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Shown when someone opens TrackFit's privacy rationale from Health Connect.
 * This text must match the full Play Store privacy policy before public release.
 */
class PermissionsRationaleActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val layout = LinearLayout(this)
        layout.orientation = LinearLayout.VERTICAL
        layout.setPadding(48, 64, 48, 48)
        layout.gravity = Gravity.TOP

        val heading = TextView(this)
        heading.text = "TrackFit and your health data"
        heading.textSize = 24f
        layout.addView(heading)

        val body = TextView(this)
        body.text = """
            TrackFit asks for read-only access to your daily step count.

            We use your day's total steps for daily check-ins and weekly
            training reviews. Steps are imported only when you tap Sync.
            If you then save a check-in, that total and its source are
            stored with your signed-in TrackFit account.

            We do not write health data back to Health Connect,
            read heart rate or sleep, or collect activity in the
            background in this version.

            You may revoke access in Android's Health Connect settings.
            If you do not grant access, manual check-ins still work.

            This is a development build. A complete public privacy policy
            will be required before Play Store distribution.
        """.trimIndent()
        body.textSize = 16f
        body.setPadding(0, 32, 0, 0)
        layout.addView(body)
        setContentView(layout)
    }
}
