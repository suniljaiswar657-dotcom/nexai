(() => {
  const $ = (selector) => document.querySelector(selector);
  const STORAGE_KEY = "nexai_demo_leads_v1";
  const demoLeads = [
    {id:"NX-1006",name:"Priya Kumar",phone:"9876543210",service:"AC repair",message:"AC is not cooling properly.",date:todayOffset(0),status:"New"},
    {id:"NX-1005",name:"Aarav Shah",phone:"9820012345",service:"Plumbing",message:"Kitchen tap leakage.",date:todayOffset(0),status:"New"},
    {id:"NX-1004",name:"Sana Khan",phone:"9892011223",service:"Appliance repair",message:"Washing machine inspection.",date:todayOffset(1),status:"Contacted"},
    {id:"NX-1003",name:"Rohan Patil",phone:"9765432109",service:"Electrical work",message:"Need help with a ceiling fan.",date:todayOffset(2),status:"Qualified"},
    {id:"NX-1002",name:"Meera Joshi",phone:"9819087654",service:"AC repair",message:"Annual service request.",date:todayOffset(3),status:"Contacted"},
    {id:"NX-1001",name:"Kabir Das",phone:"9899001122",service:"Other service",message:"Need a site visit.",date:todayOffset(4),status:"New"}
  ];
  function todayOffset(offset) {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toISOString().slice(0,10);
  }
  function loadLeads() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(saved) ? saved : demoLeads;
    } catch (_) { return demoLeads; }
  }
  let leads = loadLeads();
  function saveLeads() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(leads)); }
    catch (_) { showToast("Browser storage unavailable. Changes may not persist."); }
  }
  function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  }
  function initials(name) {
    return String(name).trim().split(/\s+/).slice(0,2).map(part => part[0] || "").join("").toUpperCase();
  }
  function formatDate(date) {
    const d = new Date(date + "T00:00:00");
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  }
  function render() {
    const query = ($("#lead-search")?.value || "").trim().toLowerCase();
    const status = $("#status-filter")?.value || "all";
    const filtered = leads.filter(lead => {
      const matchesText = [lead.name,lead.phone,lead.service,lead.message,lead.id].join(" ").toLowerCase().includes(query);
      return matchesText && (status === "all" || lead.status === status);
    });
    $("#total-count").textContent = leads.length;
    $("#new-count").textContent = leads.filter(x => x.status === "New").length;
    $("#contacted-count").textContent = leads.filter(x => x.status === "Contacted").length;
    $("#qualified-count").textContent = leads.filter(x => x.status === "Qualified").length;
    $("#lead-caption").textContent = `Showing ${filtered.length} of ${leads.length} leads`;
    $("#leads-body").innerHTML = filtered.map(lead => {
      const statusClass = lead.status.toLowerCase();
      return `<tr>
        <td><div class="customer-cell"><span class="customer-avatar">${safe(initials(lead.name))}</span><div><b>${safe(lead.name)}</b><small>${safe(lead.phone)} · ${safe(lead.id)}</small></div></div></td>
        <td>${safe(lead.service)}</td><td>${safe(formatDate(lead.date))}</td>
        <td><span class="table-status ${safe(statusClass)}">${safe(lead.status)}</span></td>
        <td><select class="status-select" data-lead-id="${safe(lead.id)}" aria-label="Change status for ${safe(lead.name)}"><option ${lead.status==="New"?"selected":""}>New</option><option ${lead.status==="Contacted"?"selected":""}>Contacted</option><option ${lead.status==="Qualified"?"selected":""}>Qualified</option></select></td>
      </tr>`;
    }).join("");
    $("#empty-state").classList.toggle("hidden", filtered.length !== 0);
  }
  let toastTimer;
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }
  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({behavior:"smooth",block:"start"});
  }
  document.querySelectorAll("[data-scroll]").forEach(button => button.addEventListener("click", () => scrollToSection(button.dataset.scroll)));
  document.querySelectorAll("[data-open-dashboard]").forEach(button => button.addEventListener("click", () => scrollToSection("dashboard")));
  $(".menu-toggle").addEventListener("click", () => $(".main-nav").classList.toggle("open"));
  document.querySelectorAll(".main-nav a").forEach(link => link.addEventListener("click", () => $(".main-nav").classList.remove("open")));
  $("#enquiry-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const service = String(data.get("service") || "").trim();
    if (!name || !phone || !service) return;
    const lead = {
      id: "NX-" + Date.now().toString().slice(-7),
      name, phone, service,
      message: String(data.get("message") || "").trim(),
      date: todayOffset(0),
      status: "New"
    };
    leads.unshift(lead);
    saveLeads();
    render();
    form.reset();
    $("#form-feedback").textContent = "Enquiry added to this browser's demo workspace.";
    showToast("New enquiry added successfully");
    scrollToSection("dashboard");
  });
  $("#lead-search").addEventListener("input", render);
  $("#status-filter").addEventListener("change", render);
  $("#leads-body").addEventListener("change", (event) => {
    const select = event.target.closest("[data-lead-id]");
    if (!select) return;
    const lead = leads.find(item => item.id === select.dataset.leadId);
    if (!lead) return;
    lead.status = select.value;
    saveLeads();
    render();
    showToast("Lead status updated");
  });
  $("#export-csv").addEventListener("click", () => {
    if (!leads.length) return showToast("There are no leads to export");
    const columns = ["id","name","phone","service","message","date","status"];
    const csvCell = value => '"' + String(value ?? "").replace(/"/g,'""') + '"';
    const csv = [columns.join(","), ...leads.map(lead => columns.map(key => csvCell(lead[key])).join(","))].join("\r\n");
    const blob = new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nexai-leads.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("Lead list exported");
  });
  $("#year").textContent = new Date().getFullYear();
  render();
})();