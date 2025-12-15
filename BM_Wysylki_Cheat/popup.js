document.getElementById("clickButton").addEventListener("click", async () => {

    const NR_AKCJI = document.getElementById("nr_akcji").value;
    const WYBIERZ_VELO_VALUE = document.getElementById("velo").value;
    const quantity = parseInt(document.getElementById("quantity").value) || 1;

    if (!NR_AKCJI) {
        document.querySelector(".error").textContent = "Podaj numer akcji";
        return;
    }

    document.getElementById("clickButton").disabled = true;
    document.querySelector(".error").textContent = "";
    document.querySelector(".success").textContent = "Generuję...";

    /* =======================
       📸 WIELE ZDJĘĆ
    ======================= */
    const files = [...document.querySelector("#fileInput").files];
    const filesData = [];

    for (const file of files) {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const chunkSize = 0x8000;

        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }

        filesData.push({
            name: file.name,
            type: file.type,
            base64: btoa(binary)
        });
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    for (let i = 0; i < quantity; i++) {
        setTimeout(() => {

            const fileForThisIteration = filesData.length ? filesData[i % filesData.length] : null;

            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                world: "MAIN",
                args: [NR_AKCJI, WYBIERZ_VELO_VALUE, fileForThisIteration],
                func: async (NR_AKCJI, WYBIERZ_VELO_VALUE, fileData) => {

                    function fireMouse(el) {
                        if (!el) return;
                        const r = el.getBoundingClientRect();
                        const x = r.left + r.width / 2;
                        const y = r.top + r.height / 2;
                        ["pointerdown","mousedown","pointerup","mouseup","click"].forEach(ev => {
                            el.dispatchEvent(new MouseEvent(ev, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));
                        });
                    }

                    function waitFor(selectorOrFn, timeout = 5000) {
                        return new Promise((resolve, reject) => {
                            const start = Date.now();
                            const interval = setInterval(() => {
                                let el = null;
                                if (typeof selectorOrFn === "string") el = document.querySelector(selectorOrFn);
                                else if (typeof selectorOrFn === "function") el = selectorOrFn();
                                if (el) { clearInterval(interval); resolve(el); }
                                else if (Date.now() - start > timeout) { clearInterval(interval); reject("Timeout waitFor"); }
                            }, 200);
                        });
                    }

                    function waitForUploadFinish(timeout = 10000) {
                        return new Promise((resolve, reject) => {
                            const start = Date.now();
                            const observer = new MutationObserver(() => {
                                const thumbnails = document.querySelectorAll("img, canvas");
                                if (thumbnails.length > 0) { observer.disconnect(); resolve(); }
                            });
                            observer.observe(document.body, { childList: true, subtree: true });
                            setTimeout(() => { observer.disconnect(); reject("Upload timeout"); }, timeout);
                        });
                    }

                    function generateRandomEmail() {
                        const firstNamesPL = ["adam","tomasz","kamil","marek","anna","kasia","katarzyna","julia","pawel","lukasz","michal","piotr","karolina","monika"];
                        const lastNamesPL = ["kowalski","nowak","mazur","wojcik","kaczmarek","zielinski","dabrowski","sikora","lewandowski","krupa"];
                        const firstNamesEN = ["john","michael","david","james","robert","daniel","thomas","jessica","emily","sarah","laura"];
                        const lastNamesEN = ["smith","johnson","brown","taylor","anderson","thompson","white","martin"];
                        const domains = ["gmail.com","wp.pl","onet.pl","interia.pl","outlook.com","o2.pl","int.pl","icloud.com"];

                        const usePolish = Math.random() < 0.8;
                        const firstName = usePolish
                            ? firstNamesPL[Math.floor(Math.random() * firstNamesPL.length)]
                            : firstNamesEN[Math.floor(Math.random() * firstNamesEN.length)];
                        const lastName = usePolish
                            ? lastNamesPL[Math.floor(Math.random() * lastNamesPL.length)]
                            : lastNamesEN[Math.floor(Math.random() * lastNamesEN.length)];

                        let email = firstName;
                        if (Math.random() < 0.5) email += [".","_",""][Math.floor(Math.random()*3)] + lastName;
                        email += Math.floor(100 + Math.random()*9000);
                        const domain = domains[Math.floor(Math.random()*domains.length)];
                        return `${email}@${domain}`;
                    }

                    function clickPickListByLabel(labelText) {
                        const labels = [...document.querySelectorAll("label")];
                        const label = labels.find(l => l.innerText.trim().toLowerCase() === labelText.toLowerCase());
                        if (!label) return;
                        const picker = label.closest("td")?.querySelector(".comboBoxItemPickerLite");
                        if (picker) fireMouse(picker);
                    }

                    function clickPickListRow(text) {
                        const rows = document.querySelectorAll("div[eventproxy^='isc_PickListMenu'] tr");
                        for (const row of rows) { if (row.innerText.trim() === text) { fireMouse(row); return; } }
                    }

                    // ▶ NOWY
                    const newBtn = document.querySelector("div[eventproxy$='_buttonNew']");
                    fireMouse(newBtn);

                    setTimeout(() => {
                        clickPickListByLabel("Rodzaj zgłoszenia");
                        setTimeout(() => clickPickListRow("Brak zasięgu"), 200);

                        setTimeout(() => { clickPickListByLabel("Event"); setTimeout(()=>clickPickListRow("Horeca"),200); }, 400);
                        setTimeout(() => { clickPickListByLabel("Region"); setTimeout(()=>clickPickListRow("R312D2S2"),200); }, 800);
                        setTimeout(() => { clickPickListByLabel("Wskaż wariant"); setTimeout(()=>clickPickListRow("Sampling VELO"),200); }, 1100);
                        setTimeout(() => { clickPickListByLabel("Wybierz VELO"); setTimeout(()=>clickPickListRow(WYBIERZ_VELO_VALUE),200); }, 1400);

                        // inputy
setTimeout(() => {
    // 🔹 Pobierz obiekt TextItem
    const nrAkcjiObj = window.isc_TextItem_2; // patrz $89 w <input> → isc_TextItem_2

    if (nrAkcjiObj) nrAkcjiObj.setValue(NR_AKCJI); // wprowadza całą wartość
    const mailInput = document.querySelector("input[name='mail_konsumenta']");
    
    mailInput.value = generateRandomEmail();
    mailInput.dispatchEvent(new Event("input", { bubbles: true }));
    mailInput.dispatchEvent(new Event("change", { bubbles: true }));
}, 1500);

                        // 🔹 Dodawanie zdjęcia i klik Anuluj
if (fileData) {
    setTimeout(async () => {
        // 🔹 Klik "Dodaj zdjęcie"
        const addBtn = [...document.querySelectorAll("div[eventproxy^='isc_SimpleTabButton_']")]
            .find(d => d.innerText.includes("Dodaj zdjęcie"));
        if (!addBtn) return;
        fireMouse(addBtn);

        // 🔹 Czekaj na input
        const input = await waitFor("input[type='file']", 6000);

        // 🔹 Konwertuj Base64 w plik
        const bin = atob(fileData.base64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < arr.length; i++) arr[i] = bin.charCodeAt(i);
        const file = new File([arr], fileData.name, { type: fileData.type });
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));

        // 🔹 Czekaj aż upload się zakończy (miniatura/canvas)
        try {
            await waitForUploadFinish(12000);

            // 🔹 Klik "Zatwierdź"
            setTimeout(() => {
                const saveDiv = [...document.querySelectorAll("div[eventproxy$='_buttonSave']")]
                    .find(d => d.innerText.includes("Zatwierdź"));

                if (saveDiv) {
                    const scObj = window[saveDiv.getAttribute("eventproxy")];
                    if (scObj && typeof scObj.click === "function") {
                        scObj.click(); // SmartClient
                    } else {
                        fireMouse(saveDiv); // fallback
                    }
                }
            }, 300)

        } catch (e) {
            console.error("❌ Upload / klik Anuluj nieudany", e);
        }

    }, 1700);
}


                    }, 600);

                }
            });

        }, i*7000);
    }

    setTimeout(() => {
        document.getElementById("clickButton").disabled = false;
        document.querySelector(".success").textContent = "";
    }, quantity*7000 + 1000);
});
