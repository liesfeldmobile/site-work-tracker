# Site Work Tracker

Site Work Tracker is a simple progressive web application (PWA) designed for site work and utility
companies. It allows field teams to record damage to telecom and electrical vaults, manage
schedules for dry utilities, wet utilities and hardscapes, and operate on any device – phone,
tablet or desktop.

## Key Features

* **User authentication** – team members can register with a username, password and role (admin or field
  worker) then log in to access the application. Roles can be used to gate additional functionality
  in future versions.
* **Damage reporting** – record new incidents of damage to telecom or electrical vaults. Each report
  stores the author, description, type and timestamp. Users can delete the records they created.
* **Schedule management** – keep track of upcoming tasks for dry utilities, wet utilities, hardscapes
  and other categories. Each task includes a date and description, and authors can remove their own
  entries.
* **Dashboard** – provides an overview of how many damage reports and scheduled tasks exist and
  shortcuts to add more.
* **Progressive web app** – install the app on your home screen and use it offline. The service
  worker caches core assets so the app remains available without network connectivity.

## How it Works

The application is entirely client‑side and stores data in the browser's `localStorage`. When a user
registers or logs in, their information is stored locally. Damage reports and schedules persist
across sessions on the same device. In a production environment you would replace the
`localStorage` interactions in `app.js` with API calls to a backend database.

### Project Structure

* `index.html` – entry point that bootstraps the app and loads the script and styles.
* `app.js` – contains the core logic for routing, state management, authentication and views.
* `styles.css` – basic styling with a responsive design so the app looks good on mobile and desktop.
* `manifest.json` – PWA manifest describing the app name, icons and colors.
* `service-worker.js` – caches core assets for offline support.
* `icons/` – placeholder icons used by the manifest. Replace with your own images for production.

### Running Locally

Because the app is just static files, you can open `index.html` directly in a browser. For full
PWA functionality (including the service worker), it's best to serve it via a local HTTP server.
If you have Python installed, you can run:

```bash
cd site-work-app
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser. The first time you load the site, it will be
cached by the service worker. Subsequently, you can disconnect from the internet and the app will
continue to work with whatever data is stored on your device.

### Deploying

You can deploy the `site-work-app` folder to any static hosting provider, such as GitHub Pages,
Netlify or Vercel. The service worker and manifest are already configured, so the app will
automatically behave like a PWA when served over HTTPS.

To publish on GitHub Pages:

1. Create a new repository on GitHub and push the contents of `site-work-app`.
2. In the repository settings, enable GitHub Pages on the `main` branch.
3. The app will be available at `https://yourusername.github.io/repository-name`.

For Netlify:

1. Drag and drop the `site-work-app` folder onto the Netlify dashboard.
2. Netlify will deploy the static site and provide a URL.

Feel free to customise and extend this project. You might integrate a real authentication provider
and database or add role‑based permissions. The code is intentionally simple to make it easy to
enhance.