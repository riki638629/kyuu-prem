// 🚨 KUNCI API ANDA TEREKSPOS DI SINI. SANGAT TIDAK AMAN UNTUK PRODUKSI.
const GEMINI_API_KEY = 'AIzaSyDTi_phUUgVijn3jotECx917uT3pTtrORI'; 
const OPENAI_API_KEY = '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';

const ENDPOINTS = {
    'gemini-2.0-flash': { url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', key: GEMINI_API_KEY, isGemini: true, label: 'GEMINI FLASH (Cepat)' },
    'gemini-2.5-pro': { url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', key: GEMINI_API_KEY, isGemini: true, label: 'GEMINI PRO (Canggih)' },
    'gpt-5-nano': { url: 'https://api.openai.com/v1/chat/completions', key: OPENAI_API_KEY, isGemini: false, label: 'GPT-5 NANO (OpenAI)' }
};

const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const chatBox = document.getElementById('chat-box');
const modelPicker = document.getElementById('model-picker');
const modelToggleButton = document.getElementById('model-toggle-btn');
const currentModelDisplay = document.getElementById('current-model-display');

let selectedModelId = 'gemini-2.0-flash'; // Default model

const customEmotes = ['🔥', '😎', '🤖', '🎉', '🚀', '⭐', '💯', '✨', '⚡', '👑'];

function getRandomEmote() {
    return customEmotes[Math.floor(Math.random() * customEmotes.length)];
}

// FUNGSI BARU: Mengubah kode markdown menjadi tag <pre>
function processMarkdownCode(text) {
    // Regex untuk menemukan blok kode (```lang\ncode\n``` atau ```\ncode\n```)
    const codeBlockRegex = /```(?:\w+\s*|)\n([\s\S]*?)\n```/g;
    
    // Mengganti semua blok kode dengan tag <pre class="code-block">kode</pre>
    let htmlText = text.replace(codeBlockRegex, (match, code) => {
        // Konversi karakter khusus ke entitas HTML untuk ditampilkan dengan benar di dalam <pre>
        const sanitizedCode = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        return `<pre class="code-block" data-raw-code="${encodeURIComponent(code)}">${sanitizedCode}</pre>`;
    });

    // Mengganti baris baru (\n) yang BUKAN di dalam blok <pre> menjadi <br>
    // Ini adalah proses multi-langkah yang lebih aman:
    // 1. Ganti <pre> sementara.
    const prePlaceholder = '___PRE_BLOCK___';
    let placeholders = [];
    htmlText = htmlText.replace(/<pre[\s\S]*?<\/pre>/g, (match) => {
        placeholders.push(match);
        return prePlaceholder;
    });
    
    // 2. Ganti \n menjadi <br> di teks yang tersisa.
    htmlText = htmlText.replace(/\n/g, '<br>');

    // 3. Kembalikan blok <pre>
    let i = 0;
    htmlText = htmlText.replace(new RegExp(prePlaceholder, 'g'), () => placeholders[i++]);

    // Hapus sisa markdown lainnya setelah pemrosesan kode (sesuai logika asli)
    htmlText = htmlText.replace(/--- /g, '### '); // Mengembalikan ###
    htmlText = htmlText.replace(/\*\*/g, '');     // Menghapus bold
    
    return htmlText;
}


// FUNGSI BARU: Copy Message
window.copyMessage = function(button) {
    const messageBubble = button.closest('.message-bubble');
    let textToCopy = '';
    
    // Cek apakah ada blok kode khusus
    const codeBlocks = messageBubble.querySelectorAll('.code-block');
    
    if (codeBlocks.length > 0) {
        // Jika ada blok kode, salin konten mentah dari semua blok kode
        codeBlocks.forEach(block => {
            // Ambil konten mentah yang di-encode dari atribut data
            const rawCode = decodeURIComponent(block.getAttribute('data-raw-code'));
            textToCopy += rawCode + '\n\n';
        });
        textToCopy = textToCopy.trim(); // Hapus whitespace akhir
        
    } else {
        // Jika tidak ada blok kode, salin konten teks normal dari gelembung (kecuali indicator dan tombol copy)
        // Buat salinan element untuk manipulasi sementara
        const tempDiv = messageBubble.cloneNode(true);
        tempDiv.querySelector('.model-indicator')?.remove();
        tempDiv.querySelector('.copy-btn')?.remove();
        textToCopy = tempDiv.textContent.trim();
    }

    // Gunakan API Clipboard
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            const originalText = button.textContent;
            button.textContent = 'Tersalin!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        })
        .catch(err => {
            console.error('Gagal menyalin:', err);
            alert('Gagal menyalin teks!');
        });
};

// --- Model Selector Logic ---
function updateModelDisplay(modelId) {
    selectedModelId = modelId;
    const modelInfo = ENDPOINTS[modelId];
    currentModelDisplay.textContent = `Model: ${modelInfo.label.split(' ')[0]}`; // Hanya tampilkan nama utama
    modelPicker.classList.add('hidden'); // Sembunyikan setelah memilih
    
    const newModelLabel = modelInfo.label.toUpperCase();
    createMessageElement(`Model diubah ke: **${newModelLabel}**`, 'system');
    
    // Atur warna tombol toggle
    modelToggleButton.className = modelInfo.isGemini 
        ? 'bg-indigo-700 text-white text-sm px-5 py-2 rounded-full hover:bg-indigo-600 transition duration-300 shadow-xl transform hover:scale-105' 
        : 'bg-green-700 text-white text-sm px-5 py-2 rounded-full hover:bg-green-600 transition duration-300 shadow-xl transform hover:scale-105';

    const icon = modelToggleButton.querySelector('i');
    icon.classList.remove('fa-chevron-up');
    icon.classList.add('fa-chevron-down');
}

function toggleModelPicker() {
    modelPicker.classList.toggle('hidden');
    const icon = modelToggleButton.querySelector('i');
    icon.classList.toggle('fa-chevron-down');
    icon.classList.toggle('fa-chevron-up');
}

// Generate Model Buttons
Object.keys(ENDPOINTS).forEach(modelId => {
    const modelInfo = ENDPOINTS[modelId];
    const button = document.createElement('button');
    button.textContent = modelInfo.label;
    
    // Styling yang lebih detail untuk tombol model
    button.className = `px-4 py-2 text-sm font-medium rounded-full transition duration-300 shadow-xl transform hover:scale-105 hover:shadow-2xl active:scale-95 whitespace-nowrap ${modelInfo.isGemini ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`;
    
    button.addEventListener('click', () => updateModelDisplay(modelId));
    modelPicker.appendChild(button);
});

modelToggleButton.addEventListener('click', toggleModelPicker);
updateModelDisplay(selectedModelId); // Initialize display

// --- Chat Logic ---
function createMessageElement(text, sender) {
    const div = document.createElement('div');
    let modelIndicator = '';
    let baseClasses = 'message-bubble max-w-xs md:max-w-xl shadow-xl transition-all duration-300';
    let htmlContent = '';

    if (sender === 'user') {
        div.className = `${baseClasses} bg-indigo-500 text-white self-end rounded-br-sm`;
        htmlContent = text.replace(/\n/g, '<br>');
    } else if (sender === 'ai') {
        const modelInfo = ENDPOINTS[selectedModelId];
        const colorClass = modelInfo.isGemini ? 'text-cyan-400' : 'text-green-400';
        modelIndicator = `<span class="model-indicator font-mono ${colorClass} block mb-1">~ ${modelInfo.label.split(' ')[0]}</span>`;
        div.className = `${baseClasses} bg-gray-700 text-gray-200 self-start rounded-bl-sm ai-message`; // Tambahkan class 'ai-message'
        
        // Gunakan fungsi baru untuk memproses markdown menjadi <pre> dan konversi \n
        htmlContent = modelIndicator + processMarkdownCode(text);
        
        // Tambahkan tombol salin untuk pesan AI
        htmlContent += `<button class="copy-btn" onclick="copyMessage(this)">Salin</button>`;

    } else if (sender === 'system') {
        div.className = `p-2 text-center text-sm text-yellow-400 bg-gray-800 rounded-lg max-w-sm self-center`;
        htmlContent = text.replace(/\n/g, '<br>');
    }

    div.innerHTML = htmlContent;
    
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return div;
}

async function sendMessage() {
    const prompt = userInput.value.trim();
    if (prompt === '') return;

    sendBtn.disabled = true;
    userInput.value = '';

    createMessageElement(prompt, 'user');

    // --- Logika Custom Response ---
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('kyuu')) {
        const responseText = `Kyuu adalah pengembang terhebat yang menciptakan dan mengawasi saya! Beliau adalah pengembang kami, Terima kasih banyak Kyy!,kalo anda ingin belajar tentang coding belajarr semangat man teman ${getRandomEmote()}`;
        createMessageElement(responseText, 'ai');
        sendBtn.disabled = false;
        userInput.focus();
        return;
    }
    // --------------------------------

    const loadingMessage = createMessageElement('<span>AI sedang berpikir...</span>', 'ai');
    loadingMessage.id = 'loading-msg';
    loadingMessage.querySelector('.copy-btn').remove(); // Hapus tombol salin dari pesan loading

    try {
        const modelConfig = ENDPOINTS[selectedModelId];

        let headers = { 'Content-Type': 'application/json' };
        let payload;
        
        if (modelConfig.isGemini) {
            // Konfigurasi Gemini
            headers['X-goog-api-key'] = modelConfig.key;
            payload = { contents: [{ parts: [{ "text": prompt }] }] };
        } else {
            // Konfigurasi OpenAI
            headers['Authorization'] = `Bearer ${modelConfig.key}`;
            payload = {
                model: selectedModelId,
                messages: [{ role: "user", content: prompt }]
            };
        }

        const response = await fetch(modelConfig.url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        loadingMessage.remove();

        let resultText;
        
        if (modelConfig.isGemini) {
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                resultText = data.candidates[0].content.parts[0].text;
            } else if (data.error) {
                resultText = `Error Gemini API: ${data.error.message}`;
            }
        } else {
             // Parsing respons OpenAI
            if (data.choices && data.choices[0] && data.choices[0].message) {
                resultText = data.choices[0].message.content;
            } else if (data.error) {
                 resultText = `Error OpenAI API: ${data.error.message}`;
            }
        }
        
        if (!resultText) {
            resultText = 'Respons AI tidak valid atau kosong.';
        }
        
        createMessageElement(resultText, 'ai');

    } catch (error) {
        console.error('Error fetching API:', error);
        const currentLoading = document.getElementById('loading-msg');
        if (currentLoading) currentLoading.remove();
        createMessageElement('Gagal terhubung ke server atau terjadi kesalahan jaringan.', 'system');
    } finally {
        sendBtn.disabled = false;
        userInput.focus();
    }
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

userInput.addEventListener('input', () => {
    sendBtn.disabled = userInput.value.trim() === '';
});

sendBtn.disabled = true;