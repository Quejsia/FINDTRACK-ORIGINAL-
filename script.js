// FindTrack - COMPLETE with Guest Mode Restrictions
const LS_REPORTS = "reports";
const LS_PROFILE = "userProfile";
const LS_SESSION = "sessionUser";

const lsRead = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || "[]"); }
  catch { return []; }
};
const lsWrite = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const nowStr = (t) => new Date(t || Date.now()).toLocaleString();
const genId = () => "r_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const escapeHtml = (s) => {
  if(!s) return "";
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
};

// Check if user is logged in
function isLoggedIn() {
  try {
    const session = JSON.parse(localStorage.getItem(LS_SESSION) || "null");
    return session !== null && session.id;
  } catch {
    return false;
  }
}

// Show guest modal
function showGuestModal() {
  const modal = document.getElementById("guestModal");
  if(modal) modal.classList.remove("hidden");
}

function closeGuestModal() {
  const modal = document.getElementById("guestModal");
  if(modal) modal.classList.add("hidden");
}

// Block feature for guests
function requireLogin(callback) {
  if(!isLoggedIn()) {
    showGuestModal();
    return false;
  }
  callback();
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  
  // Close modal
  document.getElementById("closeModal")?.addEventListener("click", closeGuestModal);
  document.getElementById("guestModal")?.addEventListener("click", (e) => {
    if(e.target.id === "guestModal") closeGuestModal();
  });
  
  // Tab switching with guest restrictions
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      
      // Restricted tabs for guests
      const restrictedTabs = ["report", "notifications", "profile"];
      if(restrictedTabs.includes(tab) && !isLoggedIn()) {
        showGuestModal();
        return;
      }
      
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".panel").forEach(p => {
        p.classList.remove("active");
        p.style.display = "none";
      });
      const el = document.getElementById(tab);
      if(el) {
        el.classList.add("active");
        el.style.display = "block";
      }
    });
  });

  // Burger menu
  const burger = document.getElementById("burgerBtn");
  const drawer = document.getElementById("sidebarDrawer");
  const overlay = document.getElementById("sidebarOverlay");
  const closeDrawer = document.getElementById("closeDrawer");
  
  const openDrawer = () => {
    drawer?.classList.remove("hidden");
    drawer?.classList.add("show");
    overlay?.classList.remove("hidden");
    document.body.style.overflow = 'hidden';
  };
  
  const closeAllDrawer = () => {
    drawer?.classList.add("hidden");
    drawer?.classList.remove("show");
    overlay?.classList.add("hidden");
    document.body.style.overflow = '';
  };
  
  burger?.addEventListener("click", openDrawer);
  closeDrawer?.addEventListener("click", closeAllDrawer);
  overlay?.addEventListener("click", closeAllDrawer);

  // Drawer navigation with guest restrictions
  document.querySelectorAll(".drawer-item").forEach(li => {
    li.addEventListener("click", () => {
      const section = li.dataset.section;
      
      // Restricted sections for guests
      const restrictedSections = ["report", "notifications", "profile", "myitems", "pinned"];
      if(restrictedSections.includes(section) && !isLoggedIn()) {
        closeAllDrawer();
        showGuestModal();
        return;
      }
      
      document.querySelectorAll(".panel").forEach(p => {
        p.classList.remove("active");
        p.style.display = "none";
      });
      const el = document.getElementById(section);
      if(el) {
        el.classList.add("active");
        el.style.display = "block";
      }
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelector(`[data-tab="${section}"]`)?.classList.add("active");
      
      if(section === "analytics") renderAnalytics();
      if(section === "myitems") renderMyItems();
      if(section === "pinned") renderPinned();
      
      closeAllDrawer();
    });
  });

  // Profile - ALL features require login
  const avatar = document.getElementById("pf_avatar");
  const avatarFile = document.getElementById("pf_avatar_file");
  const uploadBtn = document.getElementById("uploadBtn");
  const randomBtn = document.getElementById("randomAvatar");
  const nameInput = document.getElementById("pf_name");
  const emailInput = document.getElementById("pf_email");
  const contactInput = document.getElementById("pf_contact");
  const saveProfileBtn = document.getElementById("saveProfile");

  function loadProfile() {
    if(!isLoggedIn()) {
      // Guest mode - show welcome message only
      const welcome = document.getElementById("welcomeUser");
      if(welcome) welcome.textContent = "Hello, Student!";
      return;
    }
    
    const p = JSON.parse(localStorage.getItem(LS_PROFILE) || "null");
    if(p) {
      if(avatar) avatar.src = p.avatar || "https://api.dicebear.com/8.x/avataaars/svg?seed=default";
      if(nameInput) nameInput.value = p.name || "";
      if(emailInput) emailInput.value = p.email || "";
      if(contactInput) contactInput.value = p.contact || "";
      const welcome = document.getElementById("welcomeUser");
      if(welcome) welcome.textContent = `Hello, ${p.name || "Student"}!`;
    }
  }
  loadProfile();

  // Block profile features for guests
  uploadBtn?.addEventListener("click", () => requireLogin(() => avatarFile?.click()));
  
  avatarFile?.addEventListener("change", e => {
    if(!isLoggedIn()) return;
    const f = e.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = () => { if(avatar) avatar.src = r.result; };
    r.readAsDataURL(f);
  });

  if(avatar) {
    avatar.addEventListener("click", () => {
      if(!isLoggedIn()) showGuestModal();
    });
    
    avatar.addEventListener("dragover", e => {
      if(!isLoggedIn()) return;
      e.preventDefault();
      avatar.classList.add("dragging");
    });
    
    avatar.addEventListener("dragleave", () => {
      avatar.classList.remove("dragging");
    });
    
    avatar.addEventListener("drop", e => {
      if(!isLoggedIn()) {
        e.preventDefault();
        showGuestModal();
        return;
      }
      e.preventDefault();
      avatar.classList.remove("dragging");
      const f = e.dataTransfer.files[0];
      if(!f || !f.type.startsWith('image/')) return;
      const r = new FileReader();
      r.onload = () => { avatar.src = r.result; };
      r.readAsDataURL(f);
    });
  }

  randomBtn?.addEventListener("click", () => {
    requireLogin(() => {
      const seed = Math.random().toString(36).slice(2,8);
      const style = ['avataaars', 'bottts', 'fun-emoji', 'lorelei', 'pixel-art'][Math.floor(Math.random() * 5)];
      avatar.src = `https://api.dicebear.com/8.x/${style}/svg?seed=${seed}`;
      randomBtn.textContent = "🎲 Generating...";
      setTimeout(() => { randomBtn.textContent = "🎲 Random Avatar"; }, 500);
    });
  });

  saveProfileBtn?.addEventListener("click", () => {
    requireLogin(() => {
      const prof = {
        name: nameInput?.value || "",
        email: emailInput?.value || "",
        contact: contactInput?.value || "",
        avatar: avatar?.src || ""
      };
      localStorage.setItem(LS_PROFILE, JSON.stringify(prof));
      loadProfile();
      alert("✅ Profile saved!");
    });
  });

  // Report form - requires login
  const reportForm = document.getElementById("reportForm");
  const imageInput = document.getElementById("r_image");
  const imagePreview = document.getElementById("imagePreview");

  imageInput?.addEventListener("change", e => {
    if(!isLoggedIn()) return;
    const f = e.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = () => {
      imagePreview.src = r.result;
      imagePreview.style.display = "block";
    };
    r.readAsDataURL(f);
  });

  reportForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    
    if(!requireLogin(() => {})) return;
    
    const title = document.getElementById("r_title")?.value?.trim() || "";
    const location = document.getElementById("r_location")?.value?.trim() || "";
    const desc = document.getElementById("r_desc")?.value?.trim() || "";
    const type = document.getElementById("r_type")?.value || "lost";
    const createdAt = Date.now();
    const id = genId();

    function saveReport(imgData) {
      const arr = lsRead(LS_REPORTS);
      arr.push({
        id, title, location, desc, type,
        image: imgData || "",
        createdAt,
        claimed: false
      });
      lsWrite(LS_REPORTS, arr);
      renderCounts();
      renderRecent();
      runSearch();
      alert("✅ Report submitted!");
      reportForm.reset();
      imagePreview.style.display = "none";
    }

    if(imageInput?.files?.[0]) {
      const fr = new FileReader();
      fr.onload = () => saveReport(fr.result);
      fr.readAsDataURL(imageInput.files[0]);
    } else {
      saveReport("");
    }
  });

  // Counts
  function renderCounts() {
    const reports = lsRead(LS_REPORTS);
    const lost = reports.filter(r => r.type === "lost" && !r.claimed).length;
    const found = reports.filter(r => r.type === "found").length;
    const claimed = reports.filter(r => r.claimed).length;
    
    const elLost = document.getElementById("countLost");
    const elFound = document.getElementById("countFound");
    const elClaimed = document.getElementById("countClaimed");
    
    if(elLost) elLost.textContent = lost;
    if(elFound) elFound.textContent = found;
    if(elClaimed) elClaimed.textContent = claimed;
  }

  // Recent reports
  function renderRecent() {
    const list = lsRead(LS_REPORTS).sort((a,b) => b.createdAt - a.createdAt).slice(0, 5);
    const out = document.getElementById("recentList");
    if(!out) return;
    
    if(list.length === 0) {
      out.innerHTML = `<div class="empty">No reports yet. Start by reporting a lost or found item!</div>`;
      return;
    }
    
    out.innerHTML = "";
    list.forEach(r => {
      const card = document.createElement("div");
      card.className = "report-card clickable";
      card.onclick = () => showItemDetail(r.id);
      card.innerHTML = `
        <div>${r.image ? 
          `<img src="${r.image}" alt="img">` : 
          `<div style="width:72px;height:72px;border-radius:8px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:32px">📷</div>`
        }</div>
        <div class="report-meta">
          <div class="report-title">${escapeHtml(r.title)}</div>
          <div class="report-time">${nowStr(r.createdAt)}</div>
        </div>
        <div><div class="badge ${r.claimed ? 'claimed' : r.type}">${r.claimed ? 'CLAIMED' : r.type.toUpperCase()}</div></div>
      `;
      out.appendChild(card);
    });
  }

  // Search
  const sQuery = document.getElementById("s_query");
  const sFilter = document.getElementById("s_filter");
  const sLoc = document.getElementById("filterLocation");
  const sDate = document.getElementById("filterDate");
  const resultsDiv = document.getElementById("searchResults");
  const noResults = document.getElementById("noResults");
  const toggleFilters = document.getElementById("toggleFilters");

  toggleFilters?.addEventListener("click", () => {
    document.getElementById("advancedFilters")?.classList.toggle("hidden");
  });

  function runSearch() {
    const kw = (sQuery?.value || "").trim().toLowerCase();
    const filt = sFilter?.value || "all";
    const loc = (sLoc?.value || "").trim().toLowerCase();
    const date = sDate?.value || "";
    const reports = lsRead(LS_REPORTS);
    
    const results = reports.filter(r => {
      const text = `${r.title} ${r.desc} ${r.location}`.toLowerCase();
      const okKw = !kw || text.includes(kw);
      
      let okType = true;
      if(filt === "lost") okType = r.type === "lost" && !r.claimed;
      else if(filt === "found") okType = r.type === "found";
      else if(filt === "claimed") okType = r.claimed;
      
      const okLoc = !loc || (r.location || "").toLowerCase().includes(loc);
      const okDate = !date || new Date(r.createdAt).toISOString().slice(0,10) === date;
      return okKw && okType && okLoc && okDate;
    });
    
    if(!resultsDiv || !noResults) return;
    resultsDiv.innerHTML = "";
    
    if(results.length === 0) {
      noResults.classList.remove("hidden");
      return;
    } else {
      noResults.classList.add("hidden");
    }
    
    results.forEach(r => {
      const card = document.createElement("div");
      card.className = "card-item clickable";
      card.onclick = () => showItemDetail(r.id);
      card.innerHTML = `
        <div class="card-media">${r.image ? 
          `<img src="${r.image}" alt="">` : 
          `<div style="font-size:48px;opacity:.4">📷</div>`
        }</div>
        <div class="card-title">${escapeHtml(r.title)}</div>
        <div class="card-desc">${escapeHtml(r.desc || r.location || "No description")}</div>
        <div class="card-footer">
          <div>
            <small style="display:block">${escapeHtml(r.location || "Unknown")}</small>
            <small style="color:#999">${nowStr(r.createdAt)}</small>
          </div>
          <div class="badge ${r.claimed ? 'claimed' : r.type}">${r.claimed ? 'CLAIMED' : r.type.toUpperCase()}</div>
        </div>
      `;
      resultsDiv.appendChild(card);
    });
  }

  [sQuery, sFilter, sLoc, sDate].forEach(i => i?.addEventListener("input", runSearch));
  
  // ITEM DETAIL VIEW
  function showItemDetail(itemId) {
    const reports = lsRead(LS_REPORTS);
    const item = reports.find(r => r.id === itemId);
    if(!item) return;
    
    const detailContent = document.getElementById("detailContent");
    if(!detailContent) return;
    
    const canClaim = isLoggedIn() && item.type === "lost" && !item.claimed;
    
    detailContent.innerHTML = `
      <div class="detail-card">
        <div class="detail-image">
          ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.title)}">` : '<div class="no-image">📷 No Image</div>'}
        </div>
        <div class="detail-info">
          <h2>${escapeHtml(item.title)}</h2>
          <div class="detail-status">
            <div class="badge ${item.claimed ? 'claimed' : item.type}">${item.claimed ? 'CLAIMED' : item.type.toUpperCase()}</div>
          </div>
          <div class="detail-row">
            <strong>📍 Location:</strong>
            <span>${escapeHtml(item.location || "Not specified")}</span>
          </div>
          <div class="detail-row">
            <strong>📅 Date:</strong>
            <span>${nowStr(item.createdAt)}</span>
          </div>
          <div class="detail-row">
            <strong>📝 Description:</strong>
            <p>${escapeHtml(item.desc || "No description provided")}</p>
          </div>
          ${canClaim ? `
            <button class="claim-btn" onclick="claimItem('${item.id}')">
              ✅ Mark as Found
            </button>
          ` : item.type === "lost" && !item.claimed && !isLoggedIn() ? `
            <button class="claim-btn-disabled" onclick="showGuestModal()">
              🔒 Login to Mark as Found
            </button>
          ` : ''}
        </div>
      </div>
    `;
    
    document.querySelectorAll(".panel").forEach(p => {
      p.classList.remove("active");
      p.style.display = "none";
    });
    document.getElementById("itemDetail").style.display = "block";
    document.getElementById("itemDetail").classList.add("active");
  }
  
  window.showItemDetail = showItemDetail;
  window.showGuestModal = showGuestModal;
  
  // CLAIM ITEM - requires login
  window.claimItem = (itemId) => {
    if(!requireLogin(() => {})) return;
    
    if(!confirm("Mark this item as found?")) return;
    
    const reports = lsRead(LS_REPORTS);
    const item = reports.find(r => r.id === itemId);
    if(!item) return;
    
    item.claimed = true;
    item.type = "found";
    lsWrite(LS_REPORTS, reports);
    
    renderCounts();
    renderRecent();
    runSearch();
    alert("✅ Item marked as found!");
    showItemDetail(itemId);
  };
  
  // Back to search
  document.getElementById("backToSearch")?.addEventListener("click", () => {
    document.querySelectorAll(".panel").forEach(p => {
      p.classList.remove("active");
      p.style.display = "none";
    });
    document.getElementById("search").style.display = "block";
    document.getElementById("search").classList.add("active");
  });

  // My Items - requires login
  function renderMyItems() {
    const out = document.getElementById("myItemsList");
    const empty = document.getElementById("myItemsEmpty");
    if(!out || !empty) return;
    
    if(!isLoggedIn()) {
      out.innerHTML = "";
      empty.innerHTML = "Please login to view your items.";
      empty.style.display = "block";
      return;
    }
    
    const reports = lsRead(LS_REPORTS).sort((a,b) => b.createdAt - a.createdAt);
    
    if(reports.length === 0) {
      out.innerHTML = "";
      empty.innerHTML = "You haven't reported any items yet.";
      empty.style.display = "block";
      return;
    }
    
    empty.style.display = "none";
    out.innerHTML = "";
    
    reports.forEach(r => {
      const el = document.createElement("div");
      el.className = "card-item clickable";
      el.onclick = () => showItemDetail(r.id);
      el.innerHTML = `
        <div class="card-media">${r.image ? `<img src="${r.image}" alt="">` : '<div style="font-size:48px">📷</div>'}</div>
        <div class="card-title">${escapeHtml(r.title)}</div>
        <div class="card-desc">${escapeHtml(r.location || "")}</div>
        <div class="card-footer">
          <small>${nowStr(r.createdAt)}</small>
          <div class="badge ${r.claimed ? 'claimed' : r.type}">${r.claimed ? 'CLAIMED' : r.type.toUpperCase()}</div>
        </div>
      `;
      out.appendChild(el);
    });
  }

  function renderPinned() {
    const out = document.getElementById("pinnedList");
    const empty = document.getElementById("pinnedEmpty");
    if(out && empty) {
      out.innerHTML = "";
      if(!isLoggedIn()) {
        empty.innerHTML = "Please login to pin items.";
      } else {
        empty.innerHTML = "No pinned items yet.";
      }
      empty.style.display = "block";
    }
  }

  function renderAnalytics() {
    const canvas = document.getElementById("chartCanvas");
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    const reports = lsRead(LS_REPORTS);
    const lost = reports.filter(r => r.type === "lost" && !r.claimed).length;
    const found = reports.filter(r => r.type === "found").length;
    const claimed = reports.filter(r => r.claimed).length;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const total = Math.max(1, lost + found + claimed);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 20;
    const radius = Math.min(canvas.width, canvas.height) / 3;
    
    let startAngle = -Math.PI / 2;
    const data = [
      { value: lost, color: "#ff7a45", label: "Lost" },
      { value: found, color: "#2bb3d9", label: "Found" },
      { value: claimed, color: "#10b981", label: "Claimed" }
    ];
    
    data.forEach(item => {
      const sliceAngle = (item.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      startAngle += sliceAngle;
    });
    
    // Legend
    ctx.font = "12px Arial";
    let legendY = canvas.height - 40;
    data.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.fillRect(20, legendY, 12, 12);
      ctx.fillStyle = "#333";
      ctx.fillText(`${item.label}: ${item.value}`, 38, legendY + 10);
      legendY += 18;
    });
  }

  // Initial render
  renderCounts();
  renderRecent();
  runSearch();
  loadProfile();
});
