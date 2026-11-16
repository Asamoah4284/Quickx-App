# QuickX Learn app

The phone app for QuickX Learn (Android and iPhone). It has the same features as the website: courses, signals, the community, Pie trading, mentorship, books, events, plans and the wallet. It uses the same backend (`QuickX/Backend`).

Built with Expo SDK 57 and expo-router.

## Run it on your computer

```bash
npm install
npx expo start
```

The app finds a backend running on your computer at port 5000. To use another server instead:

```bash
EXPO_PUBLIC_API_URL=https://quickx.tabitacum.cloud/api npx expo start
```

Push notifications and Paystack's return to the app need a development build, not Expo Go:

```bash
eas build --profile development --platform android
```

## Builds

Profiles are in `eas.json`:

| Profile | What it makes | Server |
|---|---|---|
| `development` | A dev build that can reach a server on your local network | Your computer |
| `preview` | An APK (Android) or internal build (iPhone) to try before release | Live server |
| `production` | Store builds. The version number goes up on its own | Live server |

```bash
eas build --profile preview --platform android
eas build --profile production --platform all
eas submit --platform all
```

Before the first build, install the EAS tool (`npm install -g eas-cli`), sign in with `eas login`, and run `eas init` once. It links the project to EAS and adds the project ID that phone push notifications need.

## How payments work

The server prices every order and opens a Paystack page (`POST /api/payments/paystack/initialize`). The app shows that page in a secure in-app browser. When it closes, the app asks the usual website endpoint to check the payment and deliver the order. If the payment is still on its way, the app shows "Check payment again" with the reference.

Paystack sends people back to `https://<website>/payment/done`, which hands over to the app at `quickxlearn://payment-done`.

## Where things are

- `app/`: screens. The tabs are in `app/(tabs)`: Home, Courses, Signals, Community and Account.
- `components/ui/kit.jsx`: buttons, cards, text, tabs, badges and form fields used everywhere.
- `components/ui/Page.jsx`: the frame for each screen.
- `constants/theme.js`: colours and fonts (same as the website).
- `context/AppState.jsx`: sign in, plans and access (`has('signals')`), wallet balance.
- `utils/paystack.js`: Paystack checkout.
- `utils/currency.js`: prices are in cedis; `money()` shows them in the chosen display currency, `cedis()` shows exact amounts.
