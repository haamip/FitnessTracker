// Daily check-ins are available from Home and the account menu, but must not
// intercept every other route. The previous gate redirected every navigation
// to /checkin until a browser-wide localStorage flag was set. That both broke
// the menu and shared the flag between different accounts on one device.
// Keep this compatibility wrapper so other code importing it remains stable.
export default function DailyCheckInGate({ children }) {
  return children;
}
