/* Complete script.js - finished and ready
   - Preserves localStorage keys: reports, pinnedReports, userProfile, notifications
   - Live search (no redirects)
   - Pin / Unpin functionality
   - Profile upload (click / drag-drop) + random avatar
   - Counts + recent reports rendering
   - Sidebar burger restored
   - Mini-pages: pinned, tips, packaging, myitems, about, categories, analytics
*/

const LS_REPORTS = "reports";
const LS_PINNED = "pinnedReports";
const LS_PROFILE = "userProfile";
const LS_NOTIF = "notifications";

const lsRead = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || "[]"); }
  catch { return []; }
};
const lsWrite = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const nowStr = (t) => new Date(t || Date.now()).toLocaleString();

function genId(){ return "r_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

/* DOM ready */
document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Tabs ---------- */
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      // hide panels and mini-panels
      document.querySelectorAll(".panel, .mini-panel").forEach(p => p.classList.add("hidden"));
      const el = document.getElementById(tab);
      if(el) el.classList.remove("hidden");
    });
  });

  /* ---------- Burger / Drawer ---------- */
  const burger = document.getElementById("burgerBtn");
  const drawer = document.getElementById("sidebarDrawer");
  const overlay = document.getElementById("sidebarOverlay");
  const closeDrawer = document.getElementById("closeDrawer");
  function openDrawer(){ drawer.classList.remove("hidden"); drawer.classList.add("show"); overlay.classList.remove("hidden"); document.body.style.overflow='hidden'; }
  function closeAllDrawer(){ drawer.classList.add("hidden"); drawer.classList.remove("show"); overlay.classList.add("hidden"); document.body.style.overflow=''; }
  if(burger) burger.addEventListener("click", openDrawer);
  if(closeDrawer) closeDrawer.addEventListener("click", closeAllDrawer);
  if(overlay) overlay.addEventListener("click", closeAllDrawer);

  // drawer item clicks: open tab or mini-page
  document.querySelectorAll(".drawer-item").forEach(li => {
    li.addEventListener("click", () => {
      const section = li.dataset.section;
      // hide everything
      document.querySelectorAll(".panel, .mini-panel").forEach(p => p.classList.add("hidden"));
      // if it's a main tab id, open tab
      const mainTabs = ["home","report","search","notifications","profile"];
      if(mainTabs.includes(section)){
        document.getElementById(section)?.classList.remove("hidden");
      } else {
        // show mini page
        document.getElementById(section)?.classList.remove("hidden");
        // trigger any renderers
        if(section === "pinned") renderPinned();
        if(section === "myitems") renderMyItems();
        if(section === "analytics") renderAnalytics();
      }
      closeAllDrawer();
    });
  });

  /* ---------- Profile (upload / drag-drop / random / save) ---------- */
  const avatar = document.getElementById("pf_avatar");
  const avatarFile = document.getElementById("pf_avatar_file");
  const uploadBtn = document.getElementById("uploadBtn");
  const randomBtn = document.getElementById("randomAvatar");
  const nameInput = document.getElementById("pf_name");
  const emailInput = document.getElementById("pf_email");
  const contactInput = document.getElementById("pf_contact");
  const saveProfileBtn = document.getElementById("saveProfile");

  function loadProfile(){
    const p = JSON.parse(localStorage.getItem(LS_PROFILE) || "null");
    if(p){
      if(avatar) avatar.src = p.avatar || "";
      if(nameInput) nameInput.value = p.name || "";
      if(emailInput) emailInput.value = p.email || "";
      if(contactInput) contactInput.value = p.contact || "";
      const welcome = document.getElementById("welcomeUser");
      if(welcome) welcome.textContent = `Hello, ${p.name || "Student"}!`;
    } else {
      const welcome = document.getElementById("welcomeUser");
      if(welcome) welcome.textContent = `Hello, Student!`;
    }
  }
  loadProfile();

  if(uploadBtn) uploadBtn.addEventListener("click", ()=> avatarFile?.click());
  if(avatarFile){
    avatarFile.addEventListener("change", e=>{
      const f = e.target.files[0];
      if(!f) return;
      const r = new FileReader();
      r.onload = ()=> { if(avatar) avatar.src = r.result; };
      r.readAsDataURL(f);
    });
  }

  // drag & drop on avatar element
  if(avatar){
    avatar.addEventListener("dragover", e => { e.preventDefault(); avatar.style.opacity = ".7"; });
    avatar.addEventListener("dragleave", ()=> { avatar.style.opacity = "1"; });
    avatar.addEventListener("drop", e => {
      e.preventDefault(); avatar.style.opacity = "1";
      const f = e.dataTransfer.files[0]; if(!f) return;
      const r = new FileReader(); r.onload = ()=> { avatar.src = r.result; }; r.readAsDataURL(f);
    });
  }

  if(randomBtn) randomBtn.addEventListener("click", ()=>{
    const seed = Math.random().toString(36).slice(2,8);
    avatar.src = `https://api.dicebear.com/8.x/avataaars/svg?seed=${seed}`;
  });

  if(saveProfileBtn) saveProfileBtn.addEventListener("click", ()=>{
    const prof = { name: nameInput?.value || "", email: emailInput?.value || "", contact: contactInput?.value || "", avatar: avatar?.src || "" };
    localStorage.setItem(LS_PROFILE, JSON.stringify(prof));
    loadProfile();
    alert("Profile saved");
  });

  /* ---------- Reports: create & render ---------- */
  const reportForm = document.getElementById("reportForm");
  if(reportForm) reportForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const title = document.getElementById("r_title")?.value?.trim() || "";
    const location = document.getElementById("r_location")?.value?.trim() || "";
    const desc = document.getElementById("r_desc")?.value?.trim() || "";
    const type = document.getElementById("r_type")?.value || "lost";
    const imageInput = document.getElementById("r_image");
    const createdAt = Date.now();
    const id = genId();

    function saveReport(imgData){
      const arr = lsRead(LS_REPORTS);
      arr.push({ id, title, location, desc, type, image: imgData || "", createdAt, claimed: type==="claimed" });
      lsWrite(LS_REPORTS, arr);
      renderCounts();
      renderRecent();
      renderMyItems();
      runSearch();
      alert("Report saved");
      reportForm.reset();
    }

    if(imageInput && imageInput.files && imageInput.files[0]){
      const fr = new FileReader();
      fr.onload = ()=> saveReport(fr.result);
      fr.readAsDataURL(imageInput.files[0]);
    } else saveReport("");
  });

  /* ---------- Counts + Recent ---------- */
  function renderCounts(){
    const reports = lsRead(LS_REPORTS);
    const lost = reports.filter(r => r.type === "lost").length;
    const found = reports.filter(r => r.type === "found").length;
    const claimed = reports.filter(r => r.type === "claimed" || r.claimed).length;
    const elLost = document.getElementById("countLost");
    const elFound = document.getElementById("countFound");
    const elClaimed = document.getElementById("countClaimed");
    if(elLost) elLost.textContent = lost;
    if(elFound) elFound.textContent = found;
    if(elClaimed) elClaimed.textContent = claimed;
  }

  function renderRecent(){
    const list = lsRead(LS_REPORTS).sort((a,b)=>b.createdAt - a.createdAt).slice(0,5);
    const out = document.getElementById("recentList");
    if(!out) return;
    if(list.length === 0){ out.innerHTML = `<div class="empty">No reports yet.</div>`; return; }
    out.innerHTML = "";
    list.forEach(r => {
      const card = document.createElement("div");
      card.className = "report-card";
      card.innerHTML = `
        <div>${ r.image ? `<img src="${r.image}" alt="img">` : `<div style="width:72px;height:72px;border-radius:8px;background:#f3f4f6;display:flex;align-items:center;justify-content:center">📷</div>` }</div>
        <div class="report-meta">
          <div class="report-title">${escapeHtml(r.title)}</div>
          <div class="report-time">${nowStr(r.createdAt)}</div>
        </div>
        <div><div class="badge ${r.type === "lost" ? "lost" : r.type === "found" ? "found" : "claimed"}">${r.type.toUpperCase()}</div></div>
      `;
      out.appendChild(card);
    });
  }

  /* ---------- Pins ---------- */
  function getPinned(){ return lsRead(LS_PINNED); }
  function isPinned(id){ return getPinned().includes(id); }
  function pin(id){
    const arr = getPinned();
    if(!arr.includes(id)) arr.unshift(id);
    lsWrite(LS_PINNED, arr);
  }
  function unpin(id){
    const arr = getPinned().filter(x => x !== id);
    lsWrite(LS_PINNED, arr);
  }

  function renderPinned(){
    const out = document.getElementById("pinnedList");
    const empty = document.getElementById("pinnedEmpty");
    if(!out || !empty) return;
    const pids = getPinned();
    if(pids.length === 0){ out.innerHTML = ""; empty.classList.remove("hidden"); return; }
    empty.classList.add("hidden");
    const reports = lsRead(LS_REPORTS);
    out.innerHTML = "";
    pids.forEach(pid => {
      const r = reports.find(x => x.id === pid);
      if(!r) return;
      const card = document.createElement("div");
      card.className = "card-item";
      card.innerHTML = `
        <div class="card-media">${ r.image ? `<img src="${r.image}" alt="">` : "📷" }</div>
        <div class="card-title">${escapeHtml(r.title)}</div>
        <div class="card-desc">${escapeHtml(r.location || "Unknown")}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <small style="color:#666">${nowStr(r.createdAt)}</small>
          <button class="unpin-btn" data-id="${r.id}">Unpin</button>
        </div>
      `;
      out.appendChild(card);
    });
    // attach unpin handlers
    out.querySelectorAll(".unpin-btn").forEach(b => b.addEventListener("click", e => {
      const id = b.dataset.id; unpin(id); renderPinned();
    }));
  }

  /* ---------- My Items (user's reported items) ---------- */
  function renderMyItems(){
    const out = document.getElementById("myItemsList");
    const empty = document.getElementById("myItemsEmpty");
    if(!out || !empty) return;
    const reports = lsRead(LS_REPORTS).sort((a,b)=>b.createdAt - a.createdAt);
    if(reports.length === 0){ out.innerHTML = ""; empty.classList.remove("hidden"); return; }
    empty.classList.add("hidden");
    out.innerHTML = "";
    reports.forEach(r => {
      const el = document.createElement("div");
      el.className = "card-item";
      el.innerHTML = `
        <div class="card-media">${ r.image ? `<img src="${r.image}" alt="">` : "📷" }</div>
        <div class="card-title">${escapeHtml(r.title)}</div>
        <div class="card-desc">${escapeHtml(r.location || "")}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <small>${nowStr(r.createdAt)}</small>
          <div style="display:flex;gap:8px">
            <div class="badge ${r.type === "lost" ? "lost" : r.type === "found" ? "found" : "claimed"}">${r.type.toUpperCase()}</div>
            <button class="remove-report" data-id="${r.id}">Delete</button>
          </div>
        </div>
      `;
      out.appendChild(el);
    });
    // delete handlers
    out.querySelectorAll(".remove-report").forEach(b => {
      b.addEventListener("click", () => {
        const id = b.dataset.id;
        if(!confirm("Delete this report?")) return;
        const arr = lsRead(LS_REPORTS).filter(x => x.id !== id);
        lsWrite(LS_REPORTS, arr);
        // also remove from pinned if present
        unpin(id);
        renderMyItems(); renderRecent(); renderCounts(); renderPinned(); runSearch();
      });
    });
  }

  /* ---------- Search (live) ---------- */
  const sQuery = document.getElementById("s_query");
  const sFilter = document.getElementById("s_filter");
  const sLoc = document.getElementById("filterLocation");
  const sDate = document.getElementById("filterDate");
  const resultsDiv = document.getElementById("searchResults");
  const noResults = document.getElementById("noResults");
  const toggleFilters = document.getElementById("toggleFilters");

  if(toggleFilters) toggleFilters.addEventListener("click", ()=> document.getElementById("advancedFilters")?.classList.toggle("hidden"));

  function renderSearchCard(r){
    const div = document.createElement("div");
    div.className = "card-item";
    div.innerHTML = `
      <div class="card-media">${ r.image ? `<img src="${r.image}" alt="">` : `<div style="font-size:40px;opacity:.4">📷</div>` }</div>
      <div class="card-title">${escapeHtml(r.title)}</div>
      <div class="card-desc">${escapeHtml(r.desc || "")}</div>
      <div class="report-meta" style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <div style="font-size:12px;color:#374151">${escapeHtml(r.location || "Unknown")} • ${nowStr(r.createdAt)}</div>
        <div style="display:flex;gap:8px;align-items:center">
          <div class="badge ${r.type === "lost" ? "lost" : r.type === "found" ? "found" : "claimed"}">${r.type.toUpperCase()}</div>
          <button class="pin-toggle" data-id="${r.id}">${ isPinned(r.id) ? "📌" : "📍" }</button>
        </div>
      </div>
    `;
    return div;
  }

  function runSearch(){
    const kw = (sQuery?.value || "").trim().toLowerCase();
    const filt = sFilter?.value || "all";
    const loc = (sLoc?.value || "").trim().toLowerCase();
    const date = sDate?.value || "";
    const reports = lsRead(LS_REPORTS);
    const results = reports.filter(r=>{
      const text = `${r.title} ${r.desc} ${r.location}`.toLowerCase();
      const okKw = !kw || text.includes(kw);
      const okType = filt === "all" || r.type === filt;
      const okLoc = !loc || (r.location||"").toLowerCase().includes(loc);
      const okDate = !date || new Date(r.createdAt).toISOString().slice(0,10) === date;
      return okKw && okType && okLoc && okDate;
    });
    if(!resultsDiv || !noResults) return;
    resultsDiv.innerHTML = "";
    if(results.length === 0){ noResults.classList.remove("hidden"); return; } else noResults.classList.add("hidden");
    results.forEach(r => {
      const card = renderSearchCard(r);
      resultsDiv.appendChild(card);
    });
    // attach pin toggle listeners
    resultsDiv.querySelectorAll(".pin-toggle").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if(isPinned(id)) unpin(id); else pin(id);
        // update UI
        runSearch();
        renderPinned();
      });
    });
  }

  [sQuery, sFilter, sLoc, sDate].forEach(i => i?.addEventListener("input", runSearch));
  runSearch();

  /* ---------- Analytics (simple canvas) ---------- */
  function renderAnalytics(){
    const canvas = document.getElementById("chartCanvas");
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    const reports = lsRead(LS_REPORTS);
    const lost = reports.filter(r => r.type === "lost").length;
    const found = reports.filter(r => r.type === "found").length;
    const claimed = reports.filter(r => r.type === "claimed" || r.claimed).length;
    const data = {lost, found, claimed};
    // clear
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // simple donut
    const total = Math.max(1, lost + found + claimed);
    const centerX = canvas.width/2, centerY = canvas.height/2 - 10, radius = Math.min(canvas.width, canvas.height)/3;
    let start = -Math.PI/2;
    const colors = {lost: "#ff7a45", found: "#2bb3d9", claimed: "#10b981"};
    Object.entries(data).forEach(([k,v])=>{
      const slice = (v/total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = colors[k];
      ctx.fill();
      start += slice;
    });
    // legend
    const legendX = 10, legendY = canvas.height - 50;
    ctx.font = "12px Arial";
    let y = legendY;
    Object.entries(data).forEach(([k,v])=>{
      ctx.fillStyle = colors[k];
      ctx.fillRect(legendX, y, 10, 10);
      ctx.fillStyle = "#222";
      ctx.fillText(`${k} (${v})`, legendX + 18, y + 10);
      y += 18;
    });
  }

  /* ---------- Utilities ---------- */
  function escapeHtml(s){
    if(!s) return "";
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  /* ---------- Initial render ---------- */
  function initialRender(){
    renderCounts();
    renderRecent();
    renderPinned();
    renderMyItems();
    renderAnalytics();
    loadProfile();
    runSearch();
  }
  initialRender();

  /* ---------- Expose some functions to window for debugging if needed ---------- */
  window.FindTrack = {
    runSearch, renderPinned, renderMyItems, renderCounts, renderRecent, renderAnalytics
  };

}); // DOMContentLoaded end