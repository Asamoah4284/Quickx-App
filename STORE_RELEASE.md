# Putting QuickX Learn on Google Play and the App Store

This file lists everything to do, in order, to publish the app. It covers both stores, the
signing keys, the store listing text, and the settings in the code you might want to change.

Commands are run in the `Quickx-App` folder unless it says otherwise.

---

## 0. Before anything else (blockers)

Both stores will reject the app without these. Do them first.

| # | What | Why |
|---|---|---|
| 1 | **Deploy the backend** with the latest code (`QuickX/Backend`, branch `revamp`) | App payments and push notifications use new endpoints |
| 2 | **Privacy policy**: built at `https://quickxlearn.com/privacy`. Deploy the website, read it once, and make sure the support email works (see below) | Both stores require a public link |
| 3 | **Account deletion**: built. In the app: Account tab, then *Delete account*. On the web: `https://quickxlearn.com/delete-account` (give this link to Google Play) | Apple and Google both require it |
| 4 | **Decide how iPhone users pay for digital things** (see section 9) | Apple's rules on selling digital content |
| 5 | **A review account** with email and password, with All-Access turned on (see section 8) | The reviewers cannot receive the SMS code |

**Support email:** the privacy and deletion pages tell people to write to `support@quickxlearn.com`.
Create that mailbox, or change the address in `QuickX/Frontend/my-app/src/lib/legal.js` (the
WhatsApp number and the "last updated" date are there too). Use the same address in both stores.
Have someone who knows Ghana's Data Protection Act read the privacy policy before launch; it is a
plain, honest starting point, not legal advice.

---

## 1. Accounts you need

| Account | Cost | Notes |
|---|---|---|
| **Expo** (expo.dev) | Free | Builds the app in the cloud |
| **Google Play Console** (play.google.com/console) | US$25 once | Identity check takes a few days |
| **Apple Developer Program** (developer.apple.com/programs) | US$99 per year | Identity check takes a few days |

**Personal or business account?** If you sign up as a business (organisation), both Google and
Apple ask for a **D-U-N-S number** for the company. It is free from Dun & Bradstreet but can take
1 to 2 weeks, so request it early. The store then shows the company name as the seller.

**New personal Google Play accounts** must run a **closed test** before they can publish to
everyone: at least 12 testers opted in for 14 days in a row. Check the exact numbers shown in Play
Console, as Google changes them. Business accounts skip this.

---

## 2. Settings in the code

All of these are in `app.json`, unless it says otherwise.

| Setting | Where | Now | Notes |
|---|---|---|---|
| App name on the phone | `expo.name` | `QuickX Learn` | Keep it short; long names get cut under the icon |
| Android package id | `expo.android.package` | `com.quickxlearn.app` | **Cannot change after the first upload to Play.** Decide now |
| iPhone bundle id | `expo.ios.bundleIdentifier` | `com.quickxlearn.app` | **Cannot change after the first upload to Apple.** Decide now |
| Version people see | `expo.version` | `1.0.0` | Raise it for every store release: `1.0.1` for fixes, `1.1.0` for new features |
| Build number | Handled by EAS | Automatic | `eas.json` has `"autoIncrement": true` and `"appVersionSource": "remote"`, so you never set it by hand |
| App icon | `assets/images/icon.png` | QuickX Learn logo | 1024 x 1024, no transparency |
| Android icon | `assets/images/android-icon-*.png` | Logo layers | Foreground, background and monochrome |
| Splash screen | `expo-splash-screen` plugin in `app.json` | Logo on `#05080f` | |
| Notification icon | `assets/images/notification-icon.png` | White logo | Android needs white on transparent |
| Link scheme | `expo.scheme` | `quickxlearn` | Paystack returns to `quickxlearn://payment-done`. If you change it, change `Frontend/my-app/src/features/billing/PaymentDone.jsx` and `utils/paystack.js` too |
| iPad support | `expo.ios.supportsTablet` | `false` | Off, so Apple does not ask for iPad screenshots |
| Server address | `eas.json`, `EXPO_PUBLIC_API_URL` | `https://quickx.tabitacum.cloud/api` | Change it here if the API moves to your own domain, then rebuild |
| Permission wording | `expo-image-picker` plugin in `app.json` | Photos and camera text | Apple shows these sentences to users |

The icons are made from the logo by a script. If the logo changes, ask for the icons to be made again
rather than editing PNGs by hand.

---

## 3. Set up EAS (once)

```bash
npm install -g eas-cli
eas login
eas init
```

`eas init` creates the project on expo.dev and writes its `projectId` into `app.json`. **Phone push
notifications do not work without it.** Commit the change afterwards.

---

## 4. Android signing key (keystore)

Every Android app is signed with a key. Lose it and you cannot update the app the normal way.

**How it works with EAS and Google Play:**
- On the first Android build, EAS asks *"Generate a new Android Keystore?"*. Say **yes**. EAS creates
  the key and keeps it safe on expo.dev.
- Google Play uses **Play App Signing**: Google keeps the final signing key, and your EAS key is the
  **upload key** that proves the upload came from you.

**Back up the key straight after the first build:**

```bash
eas credentials -p android
```

Choose the `production` profile, then *Keystore*, then *Download existing keystore*. You get a
`.jks` file and three secrets (keystore password, key alias, key password).

Store the `.jks` file **and** the three secrets together somewhere safe and private: a password
manager, plus one offline copy. **Never** put them in git, email or a chat.

**If the upload key is ever lost:** in Play Console, go to *Test and release > App integrity > App
signing* and ask Google for an upload key reset. It takes a few days. This only works because Play
App Signing is on.

---

## 5. iPhone certificates

You do not create these by hand. On the first iPhone build, EAS asks you to sign in with your Apple
ID and then creates:
- the **distribution certificate**,
- the **provisioning profile**,
- the **bundle id** in your Apple account,
- and the **push notification key** (APNs). Say yes when it asks about push notifications.

To look at them or download backups later:

```bash
eas credentials -p ios
```

---

## 6. Push notifications on Android (Firebase)

Android push goes through Google's Firebase Cloud Messaging. Do this once:

1. Go to console.firebase.google.com and create a project (for example "QuickX Learn").
2. Add an **Android app** with the package name `com.quickxlearn.app`.
3. Download **`google-services.json`** and put it in the `Quickx-App` folder.
4. In `app.json`, under `expo.android`, add:
   ```json
   "googleServicesFile": "./google-services.json"
   ```
5. In Firebase, go to *Project settings > Service accounts > Generate new private key*. This
   downloads a JSON file. **Keep it private.**
6. Upload that key to EAS:
   ```bash
   eas credentials -p android
   ```
   Choose `production`, then *Google Service Account*, then *Manage your Google Service Account Key
   for Push Notifications (FCM V1)*, then upload the file.

`google-services.json` is not secret and can be committed. The service account key from step 5
**is** secret. Never commit it.

---

## 7. Build and test

**Try it first** with an APK you can install on any Android phone:

```bash
eas build --profile preview --platform android
```

EAS gives a link and a QR code. Install it, then test the things listed in section 11.

**Store builds:**

```bash
eas build --profile production --platform android   # makes an .aab for Google Play
eas build --profile production --platform ios       # makes an .ipa for the App Store
```

---

## 8. Review account

The reviewers at both stores open the app and try it. They cannot get an SMS code, and they need to
see the paid parts.

1. On the website, create an account with **email and password**, for example `review@quickxlearn.com`.
2. In Admin, give it **All-Access** for a year.
3. Give the email and password in the store forms ("App access" on Google Play, "Sign-in information"
   on Apple). Add a note: *"Sign in with email. Plans are already active on this account."*
4. Do not use this account for anything else, and keep it active.

---

## 9. Payments and store rules (read before submitting to Apple)

**Apple:** digital things that are used inside the app (plans that unlock courses, signals and the
community, and e-books) normally have to be sold with **Apple's In-App Purchase**. Apple keeps 15 to
30 percent. Paying with Paystack inside the iPhone app for these can get the app rejected.

What is usually fine without In-App Purchase:
- **1-on-1 mentorship sessions** with a real person
- **Events** (live, real-world)
- **Hardcopy books** (physical goods)

Options for the iPhone version:
1. **Members buy on the website.** The iPhone app lets people sign in and use what they bought, but
   hides the buy buttons for plans and e-books. This is the simplest option. The app must not tell
   people to go and buy elsewhere unless Apple's rules for your region allow it.
2. **Add In-App Purchase** for plans on iPhone. More work, and Apple takes a cut.

Tell the developer which option you choose before the first iPhone submission.

**Google Play** also has rules on paying for digital content in apps. Some countries allow other
payment methods, and some require Google Play Billing. Check *Policy > Payments* in Play Console for
your countries before release.

**Pie trading:** people put money into a shared trade. Both stores treat apps that handle investments
or money for trading carefully, and may ask for a licence or proof that you are allowed to offer it.
If a reviewer objects, a fast fix is to hide Pie trading in the store version and keep it on the
website. Google Play also asks every app to fill in a **financial features declaration**. Answer it
honestly about Pie trading and the wallet.

Keep the risk warnings on Signals and Pie screens. They are already there.

---

## 10. Store listing

### Text to paste

**App name** (max 30): `QuickX Learn`

**Apple subtitle** (max 30): `Forex courses, signals, mentor`

**Google Play short description** (max 80):
`Learn forex with Maxwell Donkoh: video courses, live signals and mentorship.`

**Apple promotional text** (max 170, can be changed any time without a new build):
`New: live trade signals sent to your phone the moment Maxwell posts them. Tap any price to copy it straight into your trading app.`

**Apple keywords** (max 100, commas, no spaces after commas):
`forex,trading,signals,course,mentor,ghana,fx,pips,chart,risk,technical analysis,learn trading`

**Full description** (both stores, max 4000):

```
Learn to trade forex with Maxwell Donkoh, all in one app.

QuickX Learn brings together step-by-step video courses, live trade signals, a private members community and 1-on-1 mentorship. Start with the free lessons and add what you need.

COURSES
• Video lessons from the basics to advanced strategy
• Download lessons and watch them with no internet
• Pick up where you left off

LIVE SIGNALS
• Entry, stop loss and targets for every setup
• A notification on your phone the moment a signal is posted
• Tap any price to copy it, or copy the whole trade into MT4, MT5 or your broker app
• A public track record of past results

COMMUNITY
• Share trades and charts with other members
• Ask questions and get answers from Maxwell and the community
• Private messages, live sessions and shared resources

MENTORSHIP
• Book 1-on-1 sessions with Maxwell
• Get your trades reviewed and build a plan that fits you

ALSO IN THE APP
• Pie trading: join a shared trade with a small amount
• Events and masterclasses
• Trading books and e-books
• A wallet for payouts and referral earnings, with withdrawals to Mobile Money

Pay with Mobile Money or card.

Trading carries risk. You can lose money. Signals, courses and Pies are for learning and are not financial advice. Only trade money you can afford to lose.
```

If iPhone users cannot buy inside the app (section 9, option 1), remove the line *"Pay with Mobile
Money or card."* from the Apple version.

**Category:** Education. Finance is the other choice, but it brings stricter checks.

**Contact details:** a support email, the website `https://quickxlearn.com`, and the privacy policy link.

### Pictures

| Item | Google Play | Apple |
|---|---|---|
| App icon | 512 x 512 PNG (upload) | Taken from the build |
| Screenshots | 2 to 8 phone screenshots, portrait, for example 1080 x 1920 | Phone screenshots at 1320 x 2868 (6.9 inch). Apple scales them for smaller phones |
| Feature graphic | **1024 x 500**, required | Not used |

Good screenshots to take (in this order): Home, Signals with a live signal, Courses, Community feed,
Pie trading, Plans. Take them in the preview build on a real phone. You can add a short caption on
top of each with any image editor.

### Forms in the stores

**Google Play Console** (*Policy > App content*):
- **Privacy policy:** the link from section 0
- **App access:** the review account (section 8)
- **Ads:** No ads
- **Content rating:** fill in the questionnaire. There is no violence or gambling. Answer the
  questions about money and user content honestly (the community lets members post)
- **Target audience:** 18 and over
- **Data safety:** see below
- **Financial features:** see section 9
- **Account deletion:** a link to the web page that explains how to delete an account

**Apple App Store Connect:**
- **App Privacy** ("nutrition label"): see below
- **Age rating:** answer the questionnaire. Expect 17+ because of trading with real money and user posts
- **Sign-in information:** the review account
- **Export compliance:** already answered in `app.json` (`usesNonExemptEncryption: false`)

### Data the app collects (for Data safety and App Privacy)

| Data | Why | Linked to the person |
|---|---|---|
| Name, email, phone number | Account and sign-in | Yes |
| Photos (only ones the person picks) | Profile picture and community posts | Yes |
| Messages and posts in the community | The community feature | Yes |
| Purchase history | Plans, tickets, books, Pies | Yes |
| Mobile Money number | Withdrawals | Yes |
| Push notification token | Sending notifications | Yes |

Card and Mobile Money payments are handled by **Paystack**; the app never sees card numbers.
There is **no tracking** and **no advertising**. Data is sent over an encrypted connection (HTTPS).
People can delete their account themselves, in the app or at quickxlearn.com/delete-account.

---

## 11. Check list before you submit

On a real phone, with the **preview** build pointing at the live server:

- [ ] Sign in with a phone code, and with email
- [ ] Browse while signed out; tapping Buy asks you to sign in and then carries on
- [ ] Buy a plan with Paystack (Mobile Money and card), then check it unlocks straight away
- [ ] Copy a signal price and paste it in another app
- [ ] Post a signal as Maxwell; a second phone gets the notification and opens the signal
- [ ] Post in the community with a picture, and send a private message
- [ ] Join a Pie with Paystack and with the wallet
- [ ] Book a mentorship session
- [ ] Buy an event ticket and an e-book
- [ ] Watch a lesson, download it, and watch it again in flight mode
- [ ] Request a wallet withdrawal
- [ ] Delete a test account (Account tab, then Delete account) and check you cannot sign back in

---

## 12. Send it to the stores

### Google Play

1. In Play Console, **Create app**: name *QuickX Learn*, App, Free, and accept the declarations.
2. Fill in everything in section 10.
3. **The first upload must be by hand** (Google's rule). Download the `.aab` from the EAS build page,
   then go to *Test and release > Testing > Internal testing > Create new release* and upload it.
4. Add yourself and a few testers by email, then try it from the Play Store link.
5. For a new personal account, run the **closed test** (section 1) before asking for production access.
6. When ready: *Production > Create new release*, pick the build, and send it for review.
   The first review can take several days.

**After the first upload,** EAS can upload for you:
1. In Google Cloud, create a **service account** with a JSON key.
2. In Play Console, under *Users and permissions*, invite the service account's email with release
   permissions.
3. Run `eas submit -p android` and give it the JSON key the first time. **Keep this key private;
   never commit it.**

### App Store

1. Run `eas submit -p ios --latest`. Sign in with your Apple ID. It creates the app in App Store
   Connect if needed and uploads the build to **TestFlight**.
2. In App Store Connect, install the build through **TestFlight** on your iPhone and test it.
3. Fill in everything in section 10 and attach the build to version 1.0.0.
4. **Submit for Review.** Reviews usually take one to three days. If Apple rejects it, the message
   says which rule; reply in App Store Connect or fix it and send a new build.

---

## 13. Updates later

1. Make the changes.
2. Raise `expo.version` in `app.json` (for example `1.0.0` to `1.0.1`).
3. Build and submit again:
   ```bash
   eas build --profile production --platform all
   eas submit --platform all --latest
   ```
4. Write short "What's new" text in each store.

The build number goes up on its own. The signing keys stay the same. EAS reuses them.

---

## Keep safe, never commit

| Item | Where it lives |
|---|---|
| Android keystore (`.jks`) and its 3 passwords | EAS, plus your own backup (section 4) |
| Firebase service account key (push) | Uploaded to EAS; keep a private copy |
| Google Play service account key (uploads) | Your private copy only |
| Apple ID password and 2-factor device | You |
| Review account password | The store forms and your password manager |
