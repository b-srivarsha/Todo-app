# Tasks — a minimal to-do list

<img width="641" height="221" alt="Screenshot 2026-09-27 at 12 25 43 AM" src="https://github.com/user-attachments/assets/930230f9-5f81-4cb7-83ca-74f0bb57cb17" />

A clean, responsive to-do list built with **plain HTML, CSS, and vanilla JavaScript**. It has no frameworks, no build step, and no dependencies.

## Features

- **Add tasks** with an optional due date. Due dates show as "Today", "Tomorrow", or "Overdue".
- **Mark tasks complete.** The checkmark draws itself in and the title gets an animated strike-through.
- **Delete tasks.** Deleted tasks fade and slide out, and the list closes the gap smoothly.
- **Filter** by All, Active, or Completed. Each filter shows a live count.
- **Progress indicator** shows text like "3 of 7 tasks done" alongside an animated bar.
- **Clear completed** removes every finished task in one click.
- **Persistence:** tasks are saved to `localStorage`, so they're still there after a refresh. Open tabs also stay in sync with each other.
- **Empty states** show an illustration and a message that fits the current filter.
- **Responsive** layout for phones and desktops.
- **Dark mode** follows your system setting.
- **Accessible:** semantic HTML, keyboard support, visible focus rings, screen-reader labels, and support for `prefers-reduced-motion`.

## Project structure

```
.
├── index.html   # Markup and the task <template>
├── style.css    # Design tokens, layout, animations, responsive rules
├── script.js    # State, rendering, localStorage, and event handling
└── README.md
```

## Run it locally

Because there's no build step, you can:

- **Double-click `index.html`** to open it in your browser, or
- Serve the folder with any static server. Either of these works:

  ```bash
  python3 -m http.server 8000
  # or
  npx serve .
  ```

  Then open http://localhost:8000.

## Deploy for free with GitHub Pages

GitHub Pages hosts static sites for free straight from a repository. This app is fully static, so it works without any changes.

### 1. Create a GitHub repository

1. Sign in at https://github.com. If you don't have an account, create a free one.
2. Click the **+** in the top-right corner and choose **New repository**.
3. Give it a name, such as `todo-app`.
4. Set it to **Public**. GitHub Pages is free for public repos.
5. Leave **"Add a README"** unchecked, because you already have one.
6. Click **Create repository**.

### 2. Upload the files

**Option A: in the browser (no Git needed)**

1. On the new repository page, click **"uploading an existing file"**.
2. Drag in `index.html`, `style.css`, `script.js`, and `README.md`.
3. Click **Commit changes**.

**Option B: from the command line**

Run this from the project folder, replacing `YOUR-USERNAME` and `todo-app` with your own values:

```bash
git init
git add index.html style.css script.js README.md
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/todo-app.git
git push -u origin main
```

> `index.html` must be at the **root** of the repository. GitHub Pages serves that file as the home page.

### 3. Turn on GitHub Pages

1. In your repository, go to **Settings**, then **Pages** in the left sidebar.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Under **Branch**, pick **`main`** and the **`/ (root)`** folder, then click **Save**.

### 4. Open your live site

After a minute or two, reload the Pages settings screen. A banner will show your URL:

```
https://YOUR-USERNAME.github.io/todo-app/
```

To check on the deployment, open the repo's **Actions** tab and look for the "pages build and deployment" workflow. A green check means your site is live.

### Updating the site

Every push to `main`, or every file you edit and commit on GitHub, redeploys automatically within about a minute.

### Troubleshooting

- **404 page:** make sure the file is named exactly `index.html` (all lowercase) and sits at the repo root. Wait a couple of minutes, then hard-refresh the page.
- **Styles or script not loading:** the file names are case-sensitive on GitHub Pages. `Style.css` is not the same file as `style.css`.
- **Tasks from your local copy don't appear online:** `localStorage` is stored separately for each website and each browser. Tasks saved at `localhost` won't show up on your `github.io` site, and that's expected.

## How it works

- All tasks live in one array of `{ id, title, due, done, createdAt }` objects. The app saves this array to `localStorage` under the key `minimal-todo.tasks.v1` after every change.
- Each task row is copied from a `<template>` element. Task titles are set with `textContent`, so anything a user types is always shown as text and never runs as HTML.
- Animations are pure CSS:
  - New tasks play a keyframe slide-in.
  - The checkmark is drawn by animating its SVG `stroke-dashoffset`.
  - The strike-through is a `background-size` transition.
  - Deleted tasks fade out and their height collapses to zero.
- If the user has reduced motion turned on, `prefers-reduced-motion` switches all of these animations off.

## Customizing

To change the accent color, edit `--accent` in `style.css`. It appears twice: once in `:root` for light mode, and once inside the dark-mode media query.

## License

MIT. Use it however you like.
