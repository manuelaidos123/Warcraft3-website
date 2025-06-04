# Warcraft III Fan Website

This repository contains the source code for a small fan site dedicated to **Warcraft III**. It includes static HTML pages, PHP scripts and a documentation generator. The main page welcomes visitors and offers links to story summaries, character descriptions and gameplay tips.

## Directory overview

- `auth/` – PHP scripts for login, signup and logout.
- `config/` – Configuration utilities such as database connection code.
- `database/` – SQL schema for the site's database.
- `documentation/` – Tools for generating project documentation.
- `images/`, `js/` and `sounds/` – Assets used by the web pages.

The root directory also contains pages such as `index.html`, `story.html` and `pedia.html`.

## Running the PHP pages

1. Ensure PHP is installed. A local web server is sufficient for testing:
   ```bash
   php -S localhost:8000
   ```
2. Configure database credentials by creating `config/database.env` with the variables `DB_HOST`, `DB_USER`, `DB_PASS` and `DB_NAME` (see `config/database.php`).
3. Import the SQL file from `database/warcraft3_db.sql` into your database.
4. Navigate to `http://localhost:8000/index.html` in your browser.

## Generating the documentation

The documentation generator relies on Python packages listed in `documentation/requirements.txt`. Install them with:

```bash
pip install -r documentation/requirements.txt
```

Then run the generator from the repository root:

```bash
python documentation/generate_docs.py
```

This will create documentation files inside the `documentation/` directory.

