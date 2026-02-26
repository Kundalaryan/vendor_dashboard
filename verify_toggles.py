from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. Login Flow (Simulated or bypassed if possible, but standard flow is safer)
            page.goto("http://localhost:5173/login")

            # Assuming we can mock or bypass, but for a real app, let's try to just visit dashboard directly.
            # If protected route redirects, we might need to simulate login.
            # Let's check where it redirects.

            # Fill login (using dummy credentials as this is likely mocked or we need to mock api response)
            # Since I cannot easily mock API response without intercepting, I will try to see if I can set localStorage directly.

            # Set localStorage to simulate logged-in state
            page.goto("http://localhost:5173/login")
            page.evaluate("localStorage.setItem('vendor_token', 'dummy-token')")
            page.evaluate("localStorage.setItem('vendor_info', JSON.stringify({onboarded: true, name: 'Test Vendor'}))")

            # Go to Dashboard
            page.goto("http://localhost:5173/dashboard")
            page.wait_for_load_state("networkidle")

            # Take screenshot of Dashboard Toggle
            page.screenshot(path="dashboard_toggle.png")
            print("Dashboard screenshot taken.")

            # Go to Menu
            page.goto("http://localhost:5173/menu")
            page.wait_for_load_state("networkidle")

            # Take screenshot of Menu Toggles
            page.screenshot(path="menu_toggles.png")
            print("Menu screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    main()
