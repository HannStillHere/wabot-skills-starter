/**
 * 100% Free Public APIs Integration (No API Key Required)
 */

/**
 * Weather Forecast by City Name (Open-Meteo Global Radar)
 * @param {string} cityName
 */
export async function getWeather(cityName) {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=id&format=json`,
      { signal: AbortSignal.timeout(8000) }
    );
    const geo = await geoRes.json();
    if (!geo.results || geo.results.length === 0) {
      return `❌ Kota *"${cityName}"* tidak ditemukan. Coba nama kota yang lebih spesifik.`;
    }

    const loc = geo.results[0];
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true&hourly=relativehumidity_2m&timezone=auto`,
      { signal: AbortSignal.timeout(8000) }
    );
    const wData = await weatherRes.json();
    const curr = wData.current_weather;

    const weatherCodes = {
      0: "Cerah ☀️",
      1: "Sebagian Besar Cerah 🌤️",
      2: "Berawan Sebagian ⛅",
      3: "Mendung / Berawan Tebal ☁️",
      45: "Berkabut 🌫️",
      48: "Kabut Tebal 🌫️",
      51: "Gerimis Ringan 🌦️",
      53: "Gerimis Sedang 🌦️",
      55: "Gerimis Lebat 🌧️",
      61: "Hujan Ringan 🌧️",
      63: "Hujan Sedang 🌧️",
      65: "Hujan Lebat ⛈️",
      80: "Hujan Rintik-rintik 🌦️",
      81: "Hujan Deras 🌧️",
      82: "Hujan Badai ⛈️",
      95: "Badai Petir ⚡"
    };

    const condition = weatherCodes[curr.weathercode] || "Berawan ⛅";

    return (
      `🌤️ *PRAKIRAAN CUACA REAL-TIME*\n\n` +
      `📍 *Lokasi:* ${loc.name}, ${loc.admin1 || loc.country || ""}\n` +
      `🌡️ *Suhu:* ${curr.temperature}°C\n` +
      `📊 *Kondisi:* ${condition}\n` +
      `💨 *Kecepatan Angin:* ${curr.windspeed} km/jam\n` +
      `🧭 *Arah Angin:* ${curr.winddirection}°\n` +
      `🕒 *Waktu Pantau:* ${curr.time.replace("T", " ")} (Waktu Lokal)\n\n` +
      `_Sumber: Open-Meteo Global Radar API (No-Auth)_`
    );
  } catch (err) {
    return `❌ Gagal mengambil data cuaca: ${err.message}`;
  }
}

/**
 * Live Crypto Ticker in USD & IDR (CoinGecko Simple Price)
 * @param {string} query
 */
export async function getCryptoPrice(query) {
  try {
    const coinMap = {
      btc: "bitcoin",
      bitcoin: "bitcoin",
      eth: "ethereum",
      ethereum: "ethereum",
      sol: "solana",
      solana: "solana",
      bnb: "binancecoin",
      xrp: "ripple",
      doge: "dogecoin",
      ada: "cardano",
      trx: "tron",
      ton: "the-open-network",
      pepe: "pepe",
      shib: "shiba-inu"
    };

    const targetCoin = coinMap[query.toLowerCase().trim()] || query.toLowerCase().trim();

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${targetCoin}&vs_currencies=usd,idr&include_24hr_change=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();

    if (!data[targetCoin]) {
      return `❌ Koin *"${query}"* tidak ditemukan. Coba: *btc, eth, sol, bnb, xrp, doge, pepe*.`;
    }

    const coin = data[targetCoin];
    const change24h = coin.usd_24h_change ? coin.usd_24h_change.toFixed(2) : "0.00";
    const changeIndicator = Number(change24h) >= 0 ? "🟢 +" : "🔴 ";

    return (
      `🪙 *LIVE CRYPTO MARKET TICKER*\n\n` +
      `💎 *Aset:* ${targetCoin.toUpperCase()}\n` +
      `💵 *Harga USD:* $${coin.usd ? coin.usd.toLocaleString("en-US") : "N/A"}\n` +
      `🇮🇩 *Harga IDR:* Rp ${coin.idr ? coin.idr.toLocaleString("id-ID") : "N/A"}\n` +
      `📈 *24 Jam:* ${changeIndicator}${change24h}%\n\n` +
      `_Sumber: CoinGecko Public Market API_`
    );
  } catch (err) {
    return `❌ Gagal mengambil data crypto: ${err.message}`;
  }
}

/**
 * Currency Exchange Rate to IDR (Frankfurter / European Central Bank)
 * @param {string} currencyCode
 */
export async function getExchangeRate(currencyCode = "USD") {
  try {
    const code = currencyCode.toUpperCase().trim();
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${code}&symbols=IDR,USD,EUR,SGD,MYR`, {
      signal: AbortSignal.timeout(8000)
    });
    const data = await res.json();

    if (!data.rates || !data.rates.IDR) {
      return `❌ Mata uang *"${code}"* tidak didukung. Coba: *USD, EUR, SGD, MYR, JPY, AUD, SAR*.`;
    }

    return (
      `💱 *KURS MATA UANG REAL-TIME*\n\n` +
      `💵 *1 ${code}* =\n` +
      `🇮🇩 *Rp ${Math.round(data.rates.IDR).toLocaleString("id-ID")} IDR*\n\n` +
      `📊 *Perbandingan Lain:*\n` +
      (data.rates.USD && code !== "USD" ? `• USD: $${data.rates.USD}\n` : "") +
      (data.rates.EUR && code !== "EUR" ? `• EUR: €${data.rates.EUR}\n` : "") +
      (data.rates.SGD && code !== "SGD" ? `• SGD: S$${data.rates.SGD}\n` : "") +
      (data.rates.MYR && code !== "MYR" ? `• MYR: RM ${data.rates.MYR}\n` : "") +
      `\n_Tanggal: ${data.date} (Bank Sentral Global)_`
    );
  } catch (err) {
    return `❌ Gagal mengambil data kurs: ${err.message}`;
  }
}

/**
 * Al-Quran Verse & Translation (Al-Quran Cloud)
 * @param {string} surahAndAyah - e.g. "2:255" or "1:1"
 */
export async function getQuranAyah(surahAndAyah = "2:255") {
  try {
    const clean = surahAndAyah.replace(/\s+/g, "").trim();
    const res = await fetch(
      `https://api.alquran.cloud/v1/ayah/${clean}/editions/quran-uthmani,id.indonesian`,
      { signal: AbortSignal.timeout(8000) }
    );
    const json = await res.json();

    if (json.code !== 200 || !json.data) {
      return `❌ Ayat *"${surahAndAyah}"* tidak ditemukan. Format contoh: *.quran 2:255* (Surah:Ayat) atau *.quran 1:1*.`;
    }

    const arabicData = json.data[0];
    const indoData = json.data[1];

    return (
      `📖 *AL-QUR'AN DIGITAL*\n\n` +
      `🕌 *Surah:* ${arabicData.surah.englishName} (${arabicData.surah.name}) - Ayat ${arabicData.numberInSurah}\n` +
      `📍 *Juz:* ${arabicData.juz} | *Halaman:* ${arabicData.page}\n\n` +
      `*Ayat Arab:*\n${arabicData.text}\n\n` +
      `*Arti / Terjemahan:*\n"${indoData.text}"\n\n` +
      `_Sumber: AlQuran Cloud Public API_`
    );
  } catch (err) {
    return `❌ Gagal mengambil data Al-Qur'an: ${err.message}`;
  }
}

/**
 * Free Dictionary / KBBI definition
 * @param {string} word
 */
export async function getWordDefinition(word) {
  try {
    const clean = encodeURIComponent(word.trim());
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${clean}`, {
      signal: AbortSignal.timeout(8000)
    });

    if (res.status === 404) {
      return `❌ Kata *"${word}"* tidak ditemukan dalam kamus.`;
    }

    const json = await res.json();
    const entry = json[0];
    const meaning = entry.meanings[0];
    const def = meaning.definitions[0];

    return (
      `📚 *ENGLISH DICTIONARY*\n\n` +
      `🔤 *Word:* ${entry.word} ${entry.phonetic ? `(${entry.phonetic})` : ""}\n` +
      `🏷️ *Part of Speech:* _${meaning.partOfSpeech}_\n` +
      `📖 *Definition:* ${def.definition}\n` +
      (def.example ? `💡 *Example:* "${def.example}"\n` : "") +
      `\n_Source: Free Dictionary API_`
    );
  } catch (err) {
    return `❌ Gagal mengambil arti kata: ${err.message}`;
  }
}
