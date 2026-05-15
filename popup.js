(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  let running = false;
  let abortFlag = false;
  let successCount = 0;
  let failCount = 0;
  let currentTeam = "sampling";
  let startTime = 0;
  let timerInterval = null;

  const startBtn = $("#startBtn");
  const stopBtn = $("#stopBtn");
  const logEl = $("#log");
  const progressEl = $("#progress");
  const progressBar = progressEl.querySelector(".bar");
  const runPanel = $("#runPanel");
  const formBottom = $("#formBottom");

  // --- Counter elements ---
  const counterCurrent = $("#counterCurrent");
  const counterTotal = $("#counterTotal");
  const cdOk = $("#cdOk");
  const cdFail = $("#cdFail");
  const cdTime = $("#cdTime");

  // --- Info page ---
  $("#openInfo").addEventListener("click", () => {
    window.location.href = "info.html";
  });

  // --- Team toggle ---
  $$("#teamToggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (running) return;
      $$("#teamToggle button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentTeam = btn.dataset.team;

      const isSampling = currentTeam === "sampling";
      $("#veloOfertaWrap").style.display = isSampling ? "none" : "";
      $("#eventSelect").closest("label")?.style && ($("#eventSelect").parentElement.style.display = "");
      // Event only for Sampling
      const eventLabel = [...document.querySelectorAll("label")].find(l => l.getAttribute("for") === "eventSelect");
      const eventSelect = $("#eventSelect");
      if (eventLabel) eventLabel.style.display = isSampling ? "" : "none";
      if (eventSelect) eventSelect.style.display = isSampling ? "" : "none";

      const hint = $("#nrAkcjiHint");
      hint.textContent = isSampling ? "tourplaner" : "6-7 cyfr";
      hint.className = `badge ${isSampling ? "badge-sampling" : "badge-velo"}`;
    });
  });

  // --- Mode toggle ---
  $$("#modeToggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$("#modeToggle button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.dataset.mode;
      $("#countSettings").style.display = mode === "count" ? "" : "none";
      $("#timeSettings").style.display = mode === "time" ? "" : "none";
    });
  });

  // --- Elapsed timer ---
  function formatElapsed(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  }

  function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
      cdTime.textContent = formatElapsed(Date.now() - startTime);
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  // --- Show/hide running panel ---
  function showRunPanel() {
    formBottom.style.display = "none";
    runPanel.classList.add("visible");
    runPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function hideRunPanel() {
    formBottom.style.display = "";
  }

  // --- Logging ---
  function log(msg, type = "info") {
    logEl.style.display = "block";
    const div = document.createElement("div");
    const time = new Date().toLocaleTimeString("pl-PL");
    div.className = `log-${type}`;
    div.textContent = `[${time}] ${msg}`;
    logEl.prepend(div);
    while (logEl.children.length > 100) logEl.lastChild.remove();
  }

  function updateCounter(current, total) {
    counterCurrent.textContent = current;
    counterTotal.textContent = typeof total === "number" ? total : total;
    cdOk.textContent = `OK: ${successCount}`;
    if (failCount > 0) {
      cdFail.style.display = "";
      cdFail.textContent = `FAIL: ${failCount}`;
    } else {
      cdFail.style.display = "none";
    }
  }

  function setProgress(current, total) {
    progressEl.style.display = "block";
    const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
    progressBar.style.width = `${pct}%`;
  }

  // --- File reading ---
  async function readFiles() {
    const input = $("#fileInput");
    if (!input || !input.files) return [];
    const files = [...input.files];
    const result = [];
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      result.push({ name: file.name, type: file.type, base64: btoa(binary) });
    }
    return result;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ====================================================
  //  EMAIL GENERATOR (runs in popup, checks VPS)
  // ====================================================
  const EMAIL_API = "http://51.83.154.156:3847";

  function makeRandomEmail() {
    // === NARODOWOSCI ===
    const nations = {
      pl: { // 80%
        m: ["adam","tomasz","kamil","marek","pawel","lukasz","michal","piotr","bartek","mateusz","dawid","jakub","szymon","wojciech","krzysztof","marcin","grzegorz","dominik","patryk","rafal","artur","sebastian","damian","przemek","filip","hubert","oskar","wiktor","igor","jan","maciej","norbert","adrian","konrad","robert","daniel","mariusz","radek","kacper","milosz","olek","bruno","leon","tymek","max","alan","emil"],
        f: ["anna","kasia","katarzyna","julia","karolina","monika","natalia","agnieszka","magdalena","ewa","aleksandra","weronika","zuzanna","maja","oliwia","hanna","lena","zofia","amelia","alicja","maria","martyna","patrycja","paulina","sylwia","joanna","dorota","izabela","gabriela","nikola","klaudia","emilia","dagmara","beata","marta","diana","laura","sandra","kamila","dominika","justyna"],
        lm: ["kowalski","nowak","mazur","wojcik","kaczmarek","zielinski","dabrowski","sikora","lewandowski","krupa","jankowski","grabowski","pawlak","michalski","nowakowski","adamczyk","dudek","szymanski","wozniak","kozlowski","kaminski","piotrowski","walczak","gorski","rutkowski","michalak","szewczyk","ostrowski","tomaszewski","pietrzak","marciniak","wrobel","zalewski","jasinski","bak","chmielewski","borkowski","krawczyk","sobczak","glowacki","sawicki","kubiak","maciejewski","urbanski","witkowski","stepien","jaworski"],
        lf: ["kowalska","nowak","mazur","wojcik","kaczmarek","zielinska","dabrowska","sikora","lewandowska","krupa","jankowska","grabowska","pawlak","michalska","nowakowska","adamczyk","dudek","szymanska","wozniak","kozlowska","kaminska","piotrowska","walczak","gorska","rutkowska","michalak","szewczyk","ostrowska","tomaszewska","pietrzak","marciniak","wrobel","zalewska","jasinska","bak","chmielewska","borkowska","krawczyk","sobczak","glowacka","sawicka","kubiak","maciejewska","urbanska","witkowska","stepien","jaworska"],
        domains: [["gmail.com",45],["wp.pl",15],["onet.pl",10],["interia.pl",7],["outlook.com",6],["o2.pl",5],["int.pl",4],["tlen.pl",3],["op.pl",2],["gazeta.pl",1.5],["poczta.fm",1.5]]
      },
      ua: { // 10%
        m: ["oleksandr","andriy","dmytro","mykola","volodymyr","ivan","petro","serhiy","taras","bohdan","vasyl","yuriy","maksym","artem","roman","oleh","viktor","denys","ruslan","pavlo","kyrylo","vladyslav","markiyan","nazariy","ostap"],
        f: ["oksana","natalia","tetiana","iryna","olena","anna","kateryna","yulia","maria","svitlana","daryna","alina","viktoriia","diana","sofiya","anastasiya","khrystyna","halyna","larysa","mariya","polina","zlata","veronika","bohdana","yaryna"],
        lm: ["shevchenko","bondarenko","kovalenko","tkachenko","kravchenko","oliynyk","shevchuk","polishchuk","boyko","lysenko","marchenko","rudenko","savchenko","melnyk","moroz","pavlenko","petrenko","sydorenko","khomenko","levchenko","mazur","koval","zinchenko","honcharenko","vasylenko"],
        lf: ["shevchenko","bondarenko","kovalenko","tkachenko","kravchenko","oliynyk","shevchuk","polishchuk","boyko","lysenko","marchenko","rudenko","savchenko","melnyk","moroz","pavlenko","petrenko","sydorenko","khomenko","levchenko","mazur","koval","zinchenko","honcharenko","vasylenko"],
        domains: [["gmail.com",40],["ukr.net",22],["i.ua",12],["outlook.com",8],["meta.ua",6],["bigmir.net",5],["yahoo.com",4],["rambler.ru",3]]
      },
      de: { // 4%
        m: ["lukas","leon","finn","paul","jonas","felix","maximilian","elias","noah","ben","tim","niklas","jan","moritz","david","alexander","julian","tobias","marcel","stefan","thomas","markus","andreas","christian","sebastian"],
        f: ["emma","mia","hannah","sophia","lena","anna","lea","marie","laura","julia","lisa","sarah","jana","nina","katharina","maria","johanna","clara","amelie","charlotte","frieda","greta","marlene","helene","annika"],
        lm: ["mueller","schmidt","schneider","fischer","weber","meyer","wagner","becker","schulz","hoffmann","schaefer","koch","bauer","richter","klein","wolf","schroeder","neumann","schwarz","zimmermann","braun","krueger","hartmann","lange","werner"],
        lf: ["mueller","schmidt","schneider","fischer","weber","meyer","wagner","becker","schulz","hoffmann","schaefer","koch","bauer","richter","klein","wolf","schroeder","neumann","schwarz","zimmermann","braun","krueger","hartmann","lange","werner"],
        domains: [["gmail.com",30],["web.de",18],["gmx.de",15],["t-online.de",10],["outlook.de",8],["freenet.de",6],["gmx.net",5],["yahoo.de",4],["posteo.de",2],["mail.de",2]]
      },
      en: { // 3%
        m: ["john","michael","david","james","robert","daniel","thomas","chris","alex","ryan","kevin","brian","matt","andrew","mark","steven","jason","eric","brandon","tyler","jake","noah","liam","ethan","mason","logan","luke","owen","nathan","connor","sean","kyle","derek","adam","travis","scott","greg","ben","tony","pete"],
        f: ["jessica","emily","sarah","laura","emma","olivia","sophia","ashley","hannah","samantha","rachel","megan","nicole","amanda","jennifer","lauren","rebecca","amber","brittany","victoria","grace","chloe","lily","natalie","abigail","madison","ella","zoe","leah","kate","claire","molly","brooke","paige"],
        lm: ["smith","johnson","brown","taylor","anderson","thompson","white","martin","garcia","wilson","moore","jackson","harris","clark","lewis","walker","hall","young","king","wright","lopez","hill","scott","green","baker","adams","nelson","carter","mitchell","perez","roberts","turner","phillips","campbell","parker","evans","edwards","collins","stewart","morris"],
        lf: ["smith","johnson","brown","taylor","anderson","thompson","white","martin","garcia","wilson","moore","jackson","harris","clark","lewis","walker","hall","young","king","wright","lopez","hill","scott","green","baker","adams","nelson","carter","mitchell","perez","roberts","turner","phillips","campbell","parker","evans","edwards","collins","stewart","morris"],
        domains: [["gmail.com",35],["outlook.com",15],["yahoo.com",12],["icloud.com",10],["hotmail.com",8],["aol.com",5],["live.com",5],["protonmail.com",4],["mail.com",3],["gmx.com",3]]
      },
      cz: { // 3%
        m: ["jan","petr","tomas","martin","jakub","david","lukas","filip","adam","ondrej","matej","vojtech","daniel","michal","marek","radek","pavel","jiri","karel","vaclav","ales","miroslav","stanislav","zbynek","roman"],
        f: ["tereza","anna","katarina","lucie","petra","marie","veronika","marketa","jana","eva","barbora","monika","nikola","lenka","klara","adela","simona","hana","zuzana","michaela","karolina","natalie","gabriela","kristyna","denisa"],
        lm: ["novak","svoboda","novotny","dvorak","cerny","prochazka","kucera","vesely","horak","nemec","marek","pospisil","hajek","jelinek","kral","ruzicka","benes","fiala","sedlacek","dostal","nguyen","kovar","blazek","krejci","urbanek"],
        lf: ["novakova","svobodova","novotna","dvorakova","cerna","prochazkova","kucerova","vesela","horakova","nemcova","markova","pospisilova","hajkova","jelinkova","kralova","ruzickova","benesova","fialova","sedlackova","dostalova","nguyen","kovarova","blazkova","krejcova","urbankova"],
        domains: [["gmail.com",30],["seznam.cz",28],["email.cz",12],["centrum.cz",8],["outlook.com",7],["post.cz",5],["atlas.cz",4],["volny.cz",3],["yahoo.com",3]]
      }
    };

    const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];

    // Losowanie narodowosci: PL 80%, UA 10%, DE 4%, EN 3%, CZ 3%
    const rNation = Math.random();
    let nation;
    if (rNation < 0.80) nation = nations.pl;
    else if (rNation < 0.90) nation = nations.ua;
    else if (rNation < 0.94) nation = nations.de;
    else if (rNation < 0.97) nation = nations.en;
    else nation = nations.cz;

    const isFemale = Math.random() < 0.45;
    const first = isFemale ? pick(nation.f) : pick(nation.m);
    const last = isFemale ? pick(nation.lf) : pick(nation.lm);
    // Weighted domain selection
    const pickWeighted = (items) => {
      const total = items.reduce((s, d) => s + d[1], 0);
      let r = Math.random() * total;
      for (const [name, weight] of items) { r -= weight; if (r <= 0) return name; }
      return items[items.length - 1][0];
    };
    const domain = pickWeighted(nation.domains);

    const pattern = Math.floor(Math.random()*8);
    let local;
    switch(pattern) {
      case 0: local = first + "." + last; break;
      case 1: local = first + "." + last + (89 + Math.floor(Math.random()*18)); break;
      case 2: local = first + (1989 + Math.floor(Math.random()*18)); break;
      case 3: local = first[0] + "." + last + Math.floor(1 + Math.random()*99); break;
      case 4: local = first + "_" + last; break;
      case 5: local = first + Math.floor(1 + Math.random()*999); break;
      case 6: local = last + "." + first; break;
      case 7: local = first + last; break;
    }
    return local + "@" + domain;
  }

  async function generateUniqueEmail() {
    for (let attempt = 0; attempt < 15; attempt++) {
      const email = makeRandomEmail();
      try {
        const resp = await fetch(EMAIL_API + "/check", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({ email })
        });
        const data = await resp.json();
        if (!data.exists) return email;
      } catch(e) {
        return email; // API down — use anyway
      }
    }
    return makeRandomEmail() + Math.floor(Math.random()*99999);
  }

  // ====================================================
  //  SHARED HELPERS (injected into page)
  // ====================================================
  const SHARED_PAGE_HELPERS = `
    function fireMouse(el) {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      for (const ev of ["pointerdown","mousedown","pointerup","mouseup","click"]) {
        el.dispatchEvent(new MouseEvent(ev, { bubbles:true, cancelable:true, clientX:x, clientY:y, button:0 }));
      }
      return true;
    }

    function waitFor(selectorOrFn, timeout = 5000) {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const iv = setInterval(() => {
          let el = typeof selectorOrFn === "string" ? document.querySelector(selectorOrFn) : selectorOrFn();
          if (el) { clearInterval(iv); resolve(el); }
          else if (Date.now() - start > timeout) { clearInterval(iv); reject(new Error("Timeout: " + String(selectorOrFn).slice(0,60))); }
        }, 200);
      });
    }

    function waitForUploadFinish(timeout = 3000) {
      return new Promise((resolve) => {
        var before = document.querySelectorAll("img, canvas, .thumbnailImage, [class*='thumb'], [class*='upload'], [class*='preview']").length;
        var checks = 0;
        var iv = setInterval(function() {
          checks++;
          var now = document.querySelectorAll("img, canvas, .thumbnailImage, [class*='thumb'], [class*='upload'], [class*='preview']").length;
          if (now > before) { clearInterval(iv); resolve(true); }
          if (checks * 300 > timeout) { clearInterval(iv); resolve(false); }
        }, 300);
      });
    }

    function findNewFileInput(existingInputs) {
      var allInputs = document.querySelectorAll("input[type='file']");
      for (var k = 0; k < allInputs.length; k++) {
        if (!existingInputs.includes(allInputs[k])) return allInputs[k];
      }
      return allInputs.length > 0 ? allInputs[allInputs.length - 1] : null;
    }

    function triggerFileUpload(input, file) {
      var dt = new DataTransfer();
      dt.items.add(file);
      var nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files');
      if (nativeSetter && nativeSetter.set) {
        nativeSetter.set.call(input, dt.files);
      } else {
        input.files = dt.files;
      }
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      var form = input.closest("form");
      if (form) {
        form.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    function setEmail(email) {
      var mailInput = document.querySelector("input[name='mail_konsumenta']");
      if (mailInput) {
        mailInput.value = email;
        mailInput.dispatchEvent(new Event("input", { bubbles: true }));
        mailInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    function clickPickListByLabel(labelText) {
      const labels = [...document.querySelectorAll("label")];
      const label = labels.find(l => l.innerText.trim().toLowerCase().includes(labelText.toLowerCase()));
      if (!label) return false;
      const picker = label.closest("td")?.querySelector(".comboBoxItemPickerLite");
      if (picker) { fireMouse(picker); return true; }
      return false;
    }

    function clickPickListRow(text) {
      const rows = document.querySelectorAll("div[eventproxy^='isc_PickListMenu'] tr");
      for (const row of rows) { if (row.innerText.trim() === text) { fireMouse(row); return true; } }
      return false;
    }

    function setInputByName(name, value) {
      var strValue = String(value);

      // 1. Try all isc_TextItem_N objects (SmartClient API)
      for (var n = 0; n < 30; n++) {
        var obj = window["isc_TextItem_" + n];
        if (obj && typeof obj.setValue === "function") {
          var el = obj.getDataElement ? obj.getDataElement() : null;
          if (el && el.name === name) { obj.setValue(strValue); return true; }
        }
      }

      // 2. Try isc_DynamicForm instances
      for (var n = 0; n < 20; n++) {
        var form = window["isc_DynamicForm_" + n];
        if (form && typeof form.setValue === "function") {
          try { form.setValue(name, strValue); return true; } catch(e) {}
        }
      }

      // 3. Fallback: simulate typing character by character
      var input = document.querySelector("input[name='" + name + "']");
      if (!input) return false;
      input.focus();
      input.value = "";
      input.dispatchEvent(new Event("focus", { bubbles: true }));
      for (var c = 0; c < strValue.length; c++) {
        input.value += strValue[c];
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent("keydown", { key: strValue[c], bubbles: true }));
        input.dispatchEvent(new KeyboardEvent("keyup", { key: strValue[c], bubbles: true }));
      }
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      return true;
    }

    function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

    async function uploadPhoto(fileData) {
      if (!fileData) return false;
      var existingInputs = [...document.querySelectorAll("input[type='file']")];
      var addPhotoBtn = [...document.querySelectorAll("div[eventproxy^='isc_SimpleTabButton_']")]
        .find(function(d) {
          var txt = d.innerText.toLowerCase();
          return txt.includes("dodaj") && (txt.includes("zdj") || txt.includes("foto") || txt.includes("photo"));
        });
      if (!addPhotoBtn) {
        addPhotoBtn = [...document.querySelectorAll("td, div")]
          .find(function(d) {
            var txt = d.innerText.toLowerCase().trim();
            return txt.includes("dodaj") && txt.includes("zdj") && txt.length < 40;
          });
      }
      if (!addPhotoBtn) return false;

      fireMouse(addPhotoBtn);
      await delay(1000);

      var fileInput = findNewFileInput(existingInputs);
      if (!fileInput) {
        try { fileInput = await waitFor("input[type='file']", 6000); } catch(e) { return false; }
      }
      if (!fileInput) return false;

      var bin = atob(fileData.base64);
      var arr = new Uint8Array(bin.length);
      for (var fi = 0; fi < bin.length; fi++) arr[fi] = bin.charCodeAt(fi);
      var file = new File([arr], fileData.name, { type: fileData.type });
      triggerFileUpload(fileInput, file);
      await waitForUploadFinish(3000);
      await delay(200);
      return true;
    }
  `;

  // ====================================================
  //  SAMPLING BM — execute on page
  // ====================================================
  function executeSampling(tabId, nrAkcji, veloValue, fileData, rodzajZgloszenia, eventValue, regionValue, emailValue) {
    return new Promise((resolve) => {
      chrome.scripting.executeScript(
        {
          target: { tabId },
          world: "MAIN",
          args: [nrAkcji, veloValue, fileData, rodzajZgloszenia, eventValue, regionValue, emailValue, SHARED_PAGE_HELPERS],
          func: async (NR_AKCJI, VELO_VALUE, fileData, RODZAJ, EVENT_VALUE, REGION_VALUE, EMAIL_VALUE, helpers) => {
            eval(helpers);

            const VELO_VARIANTS = [
              "VELO z aromatem Ice Berries 6mg TRIAL",
              "VELO z aromatem Peach Ice 4mg TRIAL",
              "VELO z aromatem Simply Spearmint 4mg TRIAL",
            ];
            const chosenVelo = VELO_VALUE === "random"
              ? VELO_VARIANTS[Math.floor(Math.random() * VELO_VARIANTS.length)]
              : VELO_VALUE;

            const RODZAJ_OPTIONS = ["Globalna awaria systemu", "Brak zasięgu", "Odmowa", "Nieobecność"];
            const chosenRodzaj = RODZAJ === "random"
              ? RODZAJ_OPTIONS[Math.floor(Math.random() * RODZAJ_OPTIONS.length)]
              : RODZAJ;

            try {
              const newBtn = document.querySelector("div[eventproxy$='_buttonNew']");
              if (!newBtn) throw new Error("Nie znaleziono przycisku Nowy");
              fireMouse(newBtn);
              await delay(600);

              clickPickListByLabel("Rodzaj zgłoszenia");
              await delay(250);
              clickPickListRow(chosenRodzaj);
              await delay(250);

              clickPickListByLabel("Event");
              await delay(250);
              clickPickListRow(EVENT_VALUE);
              await delay(250);

              clickPickListByLabel("Region");
              await delay(250);
              clickPickListRow(REGION_VALUE);
              await delay(250);

              clickPickListByLabel("Wskaż wariant");
              await delay(250);
              clickPickListRow("Sampling VELO");
              await delay(300);

              clickPickListByLabel("Wybierz VELO");
              await delay(250);
              clickPickListRow(chosenVelo);
              await delay(200);

              setInputByName("nr_akcji", NR_AKCJI);

              setEmail(EMAIL_VALUE);
              await delay(200);

              var photoOk = await uploadPhoto(fileData);

              await delay(300);
              const saveDiv = [...document.querySelectorAll("div[eventproxy$='_buttonSave']")]
                .find(d => d.innerText.includes("Zatwierdź"));
              if (saveDiv) {
                const scObj = window[saveDiv.getAttribute("eventproxy")];
                if (scObj && typeof scObj.click === "function") scObj.click();
                else fireMouse(saveDiv);
              } else {
                throw new Error("Nie znaleziono Zatwierdź");
              }

              return { ok: true, velo: chosenVelo, rodzaj: chosenRodzaj, photo: photoOk };
            } catch (err) {
              return { ok: false, error: err.message || String(err) };
            }
          },
        },
        (results) => {
          if (chrome.runtime.lastError) resolve({ ok: false, error: chrome.runtime.lastError.message });
          else if (results?.[0]?.result) resolve(results[0].result);
          else resolve({ ok: false, error: "Brak odpowiedzi ze skryptu" });
        }
      );
    });
  }

  // ====================================================
  //  VELO TEAM — execute on page
  // ====================================================
  function executeVeloTeam(tabId, nrAkcji, veloValue, rodzajZgloszenia, wydanaOferta, fileData, regionValue, emailValue) {
    return new Promise((resolve) => {
      chrome.scripting.executeScript(
        {
          target: { tabId },
          world: "MAIN",
          args: [nrAkcji, veloValue, rodzajZgloszenia, wydanaOferta, fileData, regionValue, emailValue, SHARED_PAGE_HELPERS],
          func: async (NR_AKCJI, VELO_VALUE, RODZAJ, OFERTA, fileData, REGION_VALUE, EMAIL_VALUE, helpers) => {
            eval(helpers);

            const VELO_VARIANTS = [
              "VELO z aromatem Ice Berries 6mg TRIAL",
              "VELO z aromatem Peach Ice 4mg TRIAL",
              "VELO z aromatem Simply Spearmint 4mg TRIAL",
            ];
            const chosenVelo = VELO_VALUE === "random"
              ? VELO_VARIANTS[Math.floor(Math.random() * VELO_VARIANTS.length)]
              : VELO_VALUE;

            const RODZAJ_OPTIONS = ["Brak zasięgu", "Odmowa", "Nieobecność"];
            const chosenRodzaj = RODZAJ === "random"
              ? RODZAJ_OPTIONS[Math.floor(Math.random() * RODZAJ_OPTIONS.length)]
              : RODZAJ;

            try {
              const newBtn = document.querySelector("div[eventproxy$='_buttonNew']");
              if (!newBtn) throw new Error("Nie znaleziono przycisku Nowy");
              fireMouse(newBtn);
              await delay(600);

              clickPickListByLabel("Rodzaj zgłoszenia");
              await delay(250);
              clickPickListRow(chosenRodzaj);
              await delay(250);

              clickPickListByLabel("Region");
              await delay(250);
              clickPickListRow(REGION_VALUE);
              await delay(250);

              clickPickListByLabel("Wskaż wydaną ofertę");
              await delay(250);
              clickPickListRow(OFERTA);
              await delay(300);

              clickPickListByLabel("Wybierz VELO");
              await delay(250);
              clickPickListRow(chosenVelo);
              await delay(200);

              setInputByName("nr_akcji", NR_AKCJI);
              await delay(100);

              setEmail(EMAIL_VALUE);
              await delay(200);

              var photoOk = await uploadPhoto(fileData);

              await delay(300);
              const saveDiv2 = [...document.querySelectorAll("div[eventproxy$='_buttonSave']")]
                .find(d => d.innerText.includes("Zatwierdź"));
              if (saveDiv2) {
                const scObj2 = window[saveDiv2.getAttribute("eventproxy")];
                if (scObj2 && typeof scObj2.click === "function") scObj2.click();
                else fireMouse(saveDiv2);
              } else {
                throw new Error("Nie znaleziono Zatwierdź");
              }

              return { ok: true, velo: chosenVelo, rodzaj: chosenRodzaj, photo: photoOk };
            } catch (err) {
              return { ok: false, error: err.message || String(err) };
            }
          },
        },
        (results) => {
          if (chrome.runtime.lastError) resolve({ ok: false, error: chrome.runtime.lastError.message });
          else if (results?.[0]?.result) resolve(results[0].result);
          else resolve({ ok: false, error: "Brak odpowiedzi ze skryptu" });
        }
      );
    });
  }

  // ====================================================
  //  MAIN LOOP
  // ====================================================
  async function run() {
    const nrAkcji = $("#nr_akcji").value.trim();
    if (!nrAkcji) { log("Podaj numer akcji!", "err"); return; }

    const veloValue = $("#velo").value;
    const delayMs = Math.max(parseFloat($("#delay").value) || 7, 3) * 1000;
    const team = currentTeam;

    const filesData = await readFiles();
    const rodzajZgloszenia = $("#rodzajZgloszenia").value;
    const wydanaOferta = $("#wydanaOferta").value;
    const eventValue = $("#eventSelect").value;
    const regionValue = $("#regionSelect").value;

    const isTimeMode = $("#modeToggle .active").dataset.mode === "time";
    let totalTarget;
    let endTime;

    if (isTimeMode) {
      const h = parseInt($("#hours").value) || 0;
      const m = parseInt($("#minutes").value) || 0;
      const totalMs = (h * 3600 + m * 60) * 1000;
      if (totalMs <= 0) { log("Ustaw czas > 0", "err"); return; }
      endTime = Date.now() + totalMs;
      totalTarget = Math.floor(totalMs / delayMs);
      log(`[${team.toUpperCase()}] Tryb czasowy: ${h}h ${m}m (~${totalTarget} zgl.)`, "info");
    } else {
      totalTarget = parseInt($("#quantity").value) || 1;
      log(`[${team.toUpperCase()}] Tryb ilosciowy: ${totalTarget} zgl.`, "info");
    }

    running = true;
    abortFlag = false;
    successCount = 0;
    failCount = 0;

    // Show running panel
    updateCounter(0, isTimeMode ? "~" + totalTarget : totalTarget);
    setProgress(0, totalTarget);
    showRunPanel();
    startTimer();
    stopBtn.disabled = false;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let i = 0;

    while (!abortFlag) {
      if (isTimeMode) {
        if (Date.now() >= endTime) break;
        const remMin = Math.ceil((endTime - Date.now()) / 60000);
        totalTarget = successCount + failCount + Math.floor((endTime - Date.now()) / delayMs);
        log(`#${i + 1} — start (zostalo ~${remMin} min)`, "info");
      } else {
        if (i >= totalTarget) break;
        log(`#${i + 1}/${totalTarget} — start`, "info");
      }

      let result;
      const emailForThis = await generateUniqueEmail();
      if (team === "sampling") {
        const fileForThis = filesData.length ? filesData[i % filesData.length] : null;
        result = await executeSampling(tab.id, nrAkcji, veloValue, fileForThis, rodzajZgloszenia, eventValue, regionValue, emailForThis);
      } else {
        const fileForThisVelo = filesData.length ? filesData[i % filesData.length] : null;
        result = await executeVeloTeam(tab.id, nrAkcji, veloValue, rodzajZgloszenia, wydanaOferta, fileForThisVelo, regionValue, emailForThis);
      }

      if (result.ok) {
        successCount++;
        const photoInfo = result.photo === true ? " +foto" : result.photo === false ? " (brak foto)" : "";
        const details = [result.velo, result.rodzaj].filter(Boolean).join(" | ");
        log(`#${i + 1} OK — ${details}${photoInfo}`, "ok");
      } else {
        failCount++;
        log(`#${i + 1} BLAD: ${result.error}`, "err");
      }

      i++;
      const displayTotal = isTimeMode ? "~" + Math.max(totalTarget, i) : totalTarget;
      updateCounter(successCount, displayTotal);
      setProgress(i, isTimeMode ? Math.max(totalTarget, i) : totalTarget);

      if (abortFlag) break;

      const shouldContinue = isTimeMode ? Date.now() < endTime : i < totalTarget;
      if (shouldContinue) {
        log(`Czekam ${(delayMs / 1000).toFixed(1)}s...`, "info");
        await sleep(delayMs);
      }
    }

    stopTimer();
    log(
      abortFlag
        ? `Zatrzymano! OK: ${successCount}, FAIL: ${failCount}`
        : `Zakonczone! OK: ${successCount}, FAIL: ${failCount}`,
      abortFlag ? "err" : "ok"
    );

    running = false;
    stopBtn.disabled = true;
    progressBar.style.width = "100%";

    // After 3s show form again
    setTimeout(() => {
      hideRunPanel();
    }, 3000);
  }

  // --- Start ---
  startBtn.addEventListener("click", () => {
    if (!running) run();
  });

  // --- Stop ---
  stopBtn.addEventListener("click", () => {
    if (running) {
      abortFlag = true;
      stopBtn.disabled = true;
      stopBtn.textContent = "Zatrzymuje...";
      log("Zatrzymywanie...", "err");
      setTimeout(() => { stopBtn.textContent = "Zatrzymaj"; }, 2000);
    }
  });
})();
