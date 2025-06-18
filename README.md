# BurialDBMS

A full-stack cemetery management system that features an interactive aerial view of plots and mausoleums. Built with HTML, CSS, and vanilla JavaScript for the frontend, and Python with FastAPI for the backend, it includes automated database seeding and real-time plot detail viewing.

Documentation + Demo: https://dandee77.github.io/posts/burial_db/

---

## 🚀 Features

* **Interactive Map UI** – Pan, zoom, and click to inspect individual plots or mausoleums in real time.
* **Full‑stack Implementation** – Vanilla HTML/CSS/JS frontend powered by a Python FastAPI backend.
* **Automated Seeding** – Python scripts populate the database with realistic mock data for instant demos.
* **One‑Command Launch** – `py main.py` boots Uvicorn *and* opens a public Ngrok tunnel for quick sharing.

---

## 🛠 Tech Stack

| Layer                    | Technology                          |
| ------------------------ | ----------------------------------- |
| **Frontend**             | HTML · CSS · JavaScript (ES6)       |
| **Backend**              | Python 3 · FastAPI · Uvicorn        |
| **Database**             | SQLite (default) – easily swappable |
| **Tunnelling / Dev Ops** | Ngrok                               |

---

## ⚡ Quick Start

1. **Clone the repo**

   ```bash
   git clone https://github.com/your‑user/burialdbms.git
   cd burialdbms
   ```
2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```
3. **(Optional) Configure Ngrok** – If you have an auth token, export it as an env var so Ngrok can use higher limits:

   ```bash
   export NGROK_AUTHTOKEN="your_token_here"
   ```
4. **Run the app**

   ```bash
   py main.py
   ```

   * Uvicorn starts the FastAPI server on `http://127.0.0.1:8000`.
   * Ngrok automatically exposes the server; you’ll see a public forwarding URL in the console.
5. **Open your browser** at the Ngrok URL or `http://127.0.0.1:8000` to explore the cemetery map.

---

## 🤝 Contributing

Pull requests are welcome! Feel free to open issues for bugs or feature ideas.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## ✉️ Contact

Created by **Your Name** – feel free to reach out on [LinkedIn](https://linkedin.com/in/your‑profile) or open an issue in the repo.
