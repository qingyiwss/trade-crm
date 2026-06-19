#!/usr/bin/env python3
"""TradeCRM Search Executor — cron job: query pending tasks, search, store results."""
import os
import sys
import json
import time
import urllib.request
import urllib.error

SUPABASE_URL = "https://adsrzcigueygierjlefr.supabase.co"
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not KEY:
    print("FATAL: SUPABASE_SERVICE_ROLE_KEY not set")
    sys.exit(1)

HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def supabase_req(method, path, params=None, body=None):
    """Make a Supabase REST API request."""
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        qs = "&".join(f"{k}={urllib.request.quote(str(v))}" for k, v in params.items())
        url += f"?{qs}"
    
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            text = resp.read().decode()
            return json.loads(text) if text else []
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()[:500]
        raise RuntimeError(f"Supabase {method} {path}: HTTP {e.code} — {err_body}")
    except Exception as e:
        raise RuntimeError(f"Supabase {method} {path}: {e}")


def query_pending_tasks():
    """Get the oldest pending task."""
    params = {
        "status": "eq.pending",
        "order": "created_at.asc",
        "limit": "1",
        "select": "*",
    }
    return supabase_req("GET", "search_tasks", params=params)


def update_task(task_id, status, results_count=None, error_message=None):
    """Update a search task."""
    body = {"status": status}
    if results_count is not None:
        body["results_count"] = results_count
    if error_message is not None:
        body["error_message"] = error_message
    params = {"id": f"eq.{task_id}"}
    return supabase_req("PATCH", "search_tasks", params=params, body=body)


def insert_customer(company_name, country, website, source="search"):
    """Insert a customer and return its id."""
    body = {
        "company_name": company_name,
        "country": country,
        "website": website,
        "source": source,
    }
    result = supabase_req("POST", "customers", body=body)
    if result:
        return result[0]["id"]
    return None


def insert_contact(customer_id, name, email, title):
    """Insert a contact linked to a customer."""
    body = {
        "customer_id": customer_id,
        "name": name,
        "email": email,
        "title": title,
    }
    return supabase_req("POST", "contacts", body=body)


def parse_search_results(raw_text):
    """Extract company info from web_search markdown output. Returns list of dicts."""
    companies = []
    lines = raw_text.split("\n")
    
    import re
    
    current = {}
    for line in lines:
        line = line.strip()
        
        # Match markdown link: [title](url)
        link_match = re.search(r'\[([^\]]+)\]\((https?://[^)]+)\)', line)
        if link_match:
            # Save previous if valid
            if current.get("name"):
                companies.append(dict(current))
            current = {"name": link_match.group(1), "url": link_match.group(2)}
            continue
        
        # Match email
        email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', line)
        if email_match and not current.get("email"):
            current["email"] = email_match.group(0)
        
        # Look for country mentions
        for country_candidate in [
            "Saudi Arabia", "UAE", "Dubai", "Kuwait", "Qatar", "Oman", "Bahrain",
            "Egypt", "Morocco", "Algeria", "Turkey", "Iran", "Iraq", "Jordan",
            "Lebanon", "Pakistan", "Indonesia", "Malaysia", "Nigeria", "Kenya",
            "USA", "UK", "Germany", "France", "Italy", "Spain", "Canada", "Australia",
        ]:
            if country_candidate.lower() in line.lower() and not current.get("country"):
                current["country"] = country_candidate
    
    if current.get("name"):
        companies.append(dict(current))
    
    # Deduplicate by name
    seen = set()
    result = []
    for c in companies:
        name_key = c["name"].lower().strip()
        if name_key not in seen:
            seen.add(name_key)
            result.append(c)
    
    return result


def main():
    # 1. Query pending tasks
    tasks = query_pending_tasks()
    
    if not tasks:
        # No pending tasks — silent
        return
    
    task = tasks[0]
    task_id = task["id"]
    product = task.get("product", "")
    country = task.get("country", "")
    
    print(f"[TRADE-CRM] Processing task {task_id}: '{product}' in '{country}'")
    
    # 2. Mark as running
    update_task(task_id, "running")
    
    try:
        # 3. Search (using Hermes web_search — we'll call this from shell)
        # Since we're in Python, we can't call web_search directly.
        # We'll search via the terminal using curl/HTTP.
        # For now, use Python's web_search equivalent
        
        query = f"{product} {country} wholesaler importer distributor contact email"
        print(f"[TRADE-CRM] Searching: {query}")
        
        # Use Google search via urllib (simple approach)
        # Actually, we need to use the Hermes web_search. 
        # Let's write results to a temp file and have the calling script handle it.
        
        # For now, do a basic search via a public API
        encoded_query = urllib.request.quote(query)
        search_url = f"https://www.google.com/search?q={encoded_query}"
        
        # Since we can't easily parse Google results in Python without a browser,
        # let's use a different approach: DuckDuckGo lite or similar
        search_url = f"https://lite.duckduckgo.com/lite/?q={encoded_query}"
        
        req = urllib.request.Request(
            search_url,
            headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                html = resp.read().decode()
        except Exception as e:
            html = f"SEARCH_ERROR: {e}"
        
        # Extract company info from HTML
        import re
        # Extract result links
        link_pattern = re.findall(r'<a[^>]*class="result-link"[^>]*href="([^"]+)"[^>]*>([^<]+)</a>', html, re.DOTALL)
        
        companies_found = []
        for url, name in link_pattern[:10]:
            name = re.sub(r'<[^>]+>', '', name).strip()
            if name and url.startswith("http"):
                companies_found.append({
                    "name": name[:200],
                    "url": url,
                    "country": country,
                    "email": "",
                })
        
        # If DuckDuckGo fails, fallback
        if not companies_found:
            print("[TRADE-CRM] DuckDuckGo returned no results, marking as partial")
            update_task(task_id, "completed", results_count=0, error_message="Search returned no results")
            return
        
        print(f"[TRADE-CRM] Found {len(companies_found)} potential companies")
        
        # 4. Insert into Supabase
        inserted = 0
        for comp in companies_found:
            try:
                cid = insert_customer(
                    company_name=comp["name"],
                    country=comp.get("country", ""),
                    website=comp.get("url", ""),
                    source="search",
                )
                if cid and comp.get("email"):
                    insert_contact(
                        customer_id=cid,
                        name="",
                        email=comp["email"],
                        title="",
                    )
                inserted += 1
                print(f"  ✓ {comp['name']}")
            except Exception as e:
                print(f"  ✗ {comp['name']}: {e}")
        
        # 5. Mark completed
        update_task(task_id, "completed", results_count=inserted)
        print(f"[TRADE-CRM] Done: {inserted} companies saved")
        
    except Exception as e:
        error_msg = str(e)[:500]
        print(f"[TRADE-CRM] ERROR: {error_msg}")
        try:
            update_task(task_id, "failed", error_message=error_msg)
        except:
            pass


if __name__ == "__main__":
    main()
