import puppeteer from 'puppeteer';

class EduarteAuth {
    private readonly portalUrl: string;
    private readonly headless: boolean;
    private readonly saveData: boolean;

    constructor(
        portalUrl: string,
        headless: boolean = true,
        saveData: boolean = false
    ) {
        this.portalUrl = portalUrl;
        this.headless = headless;
        this.saveData = saveData;
    }

    async loginEduarte(username: string, password: string) {
        const browser = await puppeteer.launch({
            headless: this.headless,
            ...(this.headless && {args: ["--window-position=-2400,-2400"]}),
        });

        try {
            // open portal url.
            const page = (await browser.pages())[0];
            await page.goto(this.portalUrl);

            // fill in username
            await page.waitForSelector('input[name="gebruikersnaam"]', {timeout: 20000});
            await page.type('input[name="gebruikersnaam"]', username);

            // fill in password and press enter
            await page.waitForSelector('input[name="wachtwoord"]', {timeout: 20000})
            await page.type('input[name="wachtwoord"]', password);
            await page.keyboard.press('Enter');

            // wait until eduarte page is loaded.
            await page.waitForSelector('img[alt="EduArtelogo"]', {timeout: 5000});

            let cookies = await page.cookies();

            if (cookies.length === 0) {
                throw new Error("There are no cookies after login.");
            }

            // successfully logged in, now format cookies.
            return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ")
        } catch (ex) {
            throw new Error(`Failed to get cookies: ${ex}`);
        } finally {
            await browser.close();
        }

    }

    async loginMicrosoft(email: string, password: string) {
        const browser = await puppeteer.launch({
            headless: this.headless,
            ...(this.headless && {args: ["--window-position=-2400,-2400"]}),
            ...(this.saveData && {userDataDir: './data'}),
        });

        try {
            // open portal url.
            const page = (await browser.pages())[0];
            await page.goto(this.portalUrl);
            await page.waitForNetworkIdle();

            // if saveData is not enabled or the eduarte logo is not visible.
            if (!this.saveData || !await page.$('img[alt="EduArtelogo"]')) {
                let skipEmail = false;

                if (this.saveData && await page.$(`div[id="otherTileText"]`)) {
                    // we need to login again, use the account selector.
                    if (await page.$(`div[data-test-id="${email}"]`)) {
                        await page.click(`div[data-test-id="${email}"]`);
                        skipEmail = true;
                    } else {
                        // the email was not found in the list. proceed with normal login.
                        await page.click(`div[id="otherTileText"]`);
                        skipEmail = false;
                    }
                }

                if (!skipEmail) {
                    // fill in email and press enter
                    await page.waitForSelector('input[type="email"]', {timeout: 10000});
                    await page.type('input[type="email"]', email);
                    await page.keyboard.press('Enter');
                }

                // fill in password and press enter
                await page.waitForSelector('input[id="passwordInput"]', {timeout: 10000})
                await page.type('input[id="passwordInput"]', password);
                await page.keyboard.press('Enter');

                // wait until eduarte page is loaded.
                await page.waitForSelector('img[alt="EduArtelogo"]', {timeout: 5000});
            }

            let cookies = await page.cookies();

            if (cookies.length === 0) {
                throw new Error("There are no cookies after login.");
            }

            // successfully logged in, now format cookies.
            return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ")
        } catch (ex) {
            console.log(ex);
            throw new Error(`Failed to get cookies: ${ex}`);
        } finally {
            await browser.close();
        }
    }
}

export {EduarteAuth};
