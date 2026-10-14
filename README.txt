==============================================================
   WHAT TO WATCH  (Google-style)  -  Browser Extension  v1.0.0
==============================================================

  Brings back Google's "What to Watch" showcase.
  Search "kdrama 2025", "best horror movies" or "what to watch"
  and a clickable list of titles appears above the Google results.

  Works on: Google Chrome, Microsoft Edge, Brave (Manifest V3)
  Data by : TMDB (free API key - you add your own)


--------------------------------------------------------------
  WHAT YOU GET
--------------------------------------------------------------
  [*] Smart detection of searches like "kdrama 2025",
      "turkish drama romance", "latest anime", "best horror movies"
  [*] Scrollable showcase above Google results
  [*] Genre chips, language filter (17), year filter, sorting
      (Most popular / Top rated / Newest)
  [*] Movies and TV shows tabs
  [*] Details panel for every title:
        - poster, rating, age certificate, runtime / seasons
        - Trailer (YouTube), IMDb link, Google search link
        - Where to watch (Stream / Rent / Buy / Free) by region
        - overview, director or creator, network, studio
        - cast with photos, and "More like this"
  [*] Full-page mode (toolbar icon) with its own search box
  [*] Light and dark mode (follows your system)


--------------------------------------------------------------
  STEP 1 - INSTALL THE EXTENSION
--------------------------------------------------------------
  1. Download this project (GitHub: Code > Download ZIP) and
     extract it, so you have a folder containing manifest.json.

  2. Open the extensions page:
        Chrome : chrome://extensions
        Edge   : edge://extensions
        Brave  : brave://extensions

  3. Turn ON "Developer mode" (top-right corner).

  4. Click "Load unpacked" and choose the folder that contains
     manifest.json.

  5. The Settings page opens by itself. Keep it open and go to
     Step 2.


--------------------------------------------------------------
  STEP 2 - GET YOUR FREE TMDB API KEY
--------------------------------------------------------------
  The extension needs a key to fetch movie and TV data.

  1. Create a free account:   https://www.themoviedb.org/signup
     (verify your email)

  2. Open:                    https://www.themoviedb.org/settings/api
     Request an API key and choose "Personal use".

  3. Copy ONE of these (both work):
        - API Key               (short, 32 characters)
        - API Read Access Token (very long)


--------------------------------------------------------------
  STEP 3 - ADD THE KEY TO THE EXTENSION
--------------------------------------------------------------
  1. On the Settings page, paste the key into "TMDB API key".
  2. Choose your Region (used for "Where to watch" and ratings):
        US GB PK IN CA AU AE SA DE FR KR JP TR ES IT BR MX
  3. Click Save. You will see: "Saved. Reload your Google tab."

  To open Settings again: chrome://extensions > What to Watch >
  Details > Extension options.


--------------------------------------------------------------
  STEP 4 - USE IT
--------------------------------------------------------------
  On Google, try searching:

     kdrama 2025                -> Korean dramas from 2025
     best horror movies         -> top-rated horror films
     latest anime               -> newest anime
     turkish drama romance      -> Turkish romance series
     bollywood comedy movies    -> Hindi comedies
     what to watch              -> popular movies now

  - Scroll the list with the arrows (it loads more as you go).
  - Use the genre chips, language, year and sort menus.
  - Switch between "Movies" and "TV shows".
  - Click any poster to open the details panel.
    Press Esc or click outside to close.
  - Click "Open full page", or the toolbar icon, for the big
    version with its own search bar. You can type a list query
    (kdrama 2025) or a title (Squid Game).

  The showcase appears when your search:
    - has 8 words or fewer
    - contains a movie/TV word (movie, film, drama, series,
      kdrama, anime...) or the phrase "what to watch"
    - has a year, language, genre or word like best/top/new/latest
    - is NOT a question about one title (how, why, who, review,
      cast, trailer, ending, episode, download...)
    It is skipped on Google's Images / News / Video tabs.


--------------------------------------------------------------
  TROUBLESHOOTING
--------------------------------------------------------------
  Showcase not showing .... Reload the Google tab after saving
                            your key. Try the search "kdrama 2025".
  "One-time setup needed" . No key saved yet. Click the link in
                            the message and add your key.
  "Key was rejected" ...... Key is wrong/incomplete. Copy it again
                            from TMDB and save.
  "Could not load titles" . Check your internet connection.
  No "Where to watch" ..... Not available for every title/region.
                            Try another region in Settings.
  Other Google domain ..... Add it to content_scripts > matches in
                            manifest.json, then reload the extension.
                            Supported: .com .com.pk .co.in .co.uk
                            .ca .com.au .ae .com.sa .de .fr .co.kr
                            .co.jp


--------------------------------------------------------------
  FILES
--------------------------------------------------------------
  manifest.json            Extension config and permissions
  background.js            Service worker (TMDB requests)
  content.js               Detects query, injects the showcase
  core.js / core.css       Engine, UI and styles
  app.html / app.js        Full-page version
  options.html / options.js  Settings (API key + region)
  icons/                   Extension icons
  assets/banner.svg        README banner
  README.md                GitHub readme
  README.txt               This file


--------------------------------------------------------------
  PRIVACY
--------------------------------------------------------------
  - Your API key is stored only in your browser
    (chrome.storage.sync). It is never sent anywhere except TMDB.
  - Permissions used: "storage" and api.themoviedb.org.
  - No tracking, no analytics, no other servers.


--------------------------------------------------------------
  CREDITS
--------------------------------------------------------------
  Movie/TV data and images: TMDB (https://www.themoviedb.org)
  "This product uses the TMDB API but is not endorsed or
  certified by TMDB."
  Streaming availability data is provided by JustWatch via TMDB.
  Independent project - not affiliated with Google.

==============================================================
