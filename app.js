"use strict";

    let data = fetch('./data.json')
      .then(response => response.json())
      .then(data => {
        console.log(data);
    
        // Access your data
        data.forEach(video => {
          console.log(video.Title);
        });
      })
      .catch(error => console.error('Error:', error));

    const STORAGE = {
      video: "pwa_vid",
      loop: "pwa_loop"
    };

    const $ = id => document.getElementById(id);

    const elements = {
      main: $("mainStage"),
      playlist: $("plFilter"),
      search: $("sInput"),
      loop: $("lToggle"),
      history: $("cHistory"),
      list: $("sList")
    };

    let activeId = null;

    // Initialize playlist options
    function init() {
      const playlists = [...new Set(data.map(v => v.Playlist))];

      const fragment = document.createDocumentFragment();

      playlists.forEach(playlist => {
        const option = document.createElement("option");
        option.value = playlist;
        option.textContent = playlist;
        fragment.appendChild(option);
      });

      elements.playlist.appendChild(fragment);

      elements.loop.checked =
        localStorage.getItem(STORAGE.loop) === "true";

      render();

      const savedVideo = data.find(
        v => v.Id === localStorage.getItem(STORAGE.video)
      );

      if (savedVideo) {
        load(savedVideo, false);
      }
    }

    // Render filtered playlist
    function render() {
      const playlist = elements.playlist.value;
      const query = elements.search.value.trim().toLowerCase();

      const fragment = document.createDocumentFragment();

      const filtered = data.filter(video =>
        (!playlist || video.Playlist === playlist) &&
        (!query || video.Title.toLowerCase().includes(query))
      );

      filtered.forEach(video => {
        const li = document.createElement("li");

        li.className =
          "song-item" +
          (activeId === video.Id ? " active" : "");

        li.tabIndex = 0;
        li.setAttribute("role", "button");
        li.setAttribute("aria-pressed", String(activeId === video.Id));

        const title = document.createElement("span");
        title.className = "song-item-title";
        title.textContent = video.Title;

        const meta = document.createElement("span");
        meta.className = "song-item-meta";
        meta.textContent = video.Playlist;

        li.append(title, meta);

        li.addEventListener("click", () => load(video, true));

        li.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            load(video, true);
          }
        });

        fragment.appendChild(li);
      });

      elements.list.replaceChildren(fragment);
    }

    // Load YouTube video
    function load(video, autoplay = false) {
      activeId = video.Id;

      localStorage.setItem(STORAGE.video, video.Id);

      render();

      const params = new URLSearchParams({
        rel: "0"
      });

      if (autoplay) {
        params.set("autoplay", "1");
      }

      if (elements.loop.checked) {
        params.set("loop", "1");
        params.set("playlist", video.Video_id);
      }

      const iframe = document.createElement("iframe");

      iframe.loading = "lazy";
      iframe.src =
        `https://www.youtube-nocookie.com/embed/` +
        `${encodeURIComponent(video.Video_id)}?${params}`;

      iframe.title = video.Title;

      iframe.allow =
        "autoplay; encrypted-media; picture-in-picture";

      iframe.allowFullscreen = true;

      iframe.referrerPolicy =
        "strict-origin-when-cross-origin";

      const videoContainer = document.createElement("div");
      videoContainer.className = "video-container";

      videoContainer.appendChild(iframe);

      const info = document.createElement("div");
      info.className = "active-info";

      const heading = document.createElement("h1");
      heading.textContent = video.Title;

      const description = document.createElement("p");
      description.append("Playlist: ");

      const playlistName = document.createElement("strong");
      playlistName.textContent = video.Playlist;

      description.appendChild(playlistName);

      info.append(heading, description);

      const windowElement = document.createElement("div");
      windowElement.className = "video-window";

      windowElement.append(videoContainer, info);

      elements.main.replaceChildren(windowElement);
    }

    // Playlist filter
    elements.playlist.addEventListener("change", render);

    // Search
    elements.search.addEventListener("input", render);

    // Loop toggle
    elements.loop.addEventListener("change", () => {
      localStorage.setItem(
        STORAGE.loop,
        String(elements.loop.checked)
      );

      const current = data.find(v => v.Id === activeId);

      if (current) {
        load(current, false);
      }
    });

    // Clear player history only
    elements.history.addEventListener("click", () => {
      localStorage.removeItem(STORAGE.video);
      localStorage.removeItem(STORAGE.loop);

      elements.loop.checked = false;

      activeId = null;

      render();

      const empty = document.createElement("div");
      empty.className = "empty-state";

      const heading = document.createElement("h2");
      heading.textContent = "Select a video below to start watching";

      empty.appendChild(heading);

      elements.main.replaceChildren(empty);
    });

    // Register PWA service worker
    async function registerServiceWorker() {
      if (!("serviceWorker" in navigator)) return;

      try {
        await navigator.serviceWorker.register(
          "./service-worker.js"
        );
      } catch {
        // Registration failure should not interrupt playback.
      }
    }

    init();
    registerServiceWorker();
