const puppeteer = require('puppeteer')
const urlParse = require('url').parse
const fsPromise = require('fs').promises
const fs = require('fs');

(async () => {
    let counter = 0
    const filePath = './result.json'
    // create file
    if (!fs.existsSync(filePath)) {
        await fsPromise.writeFile(filePath, '')
    }

    // login with your account
    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: './AllowCookies',
    })

    browser.on('targetcreated', async (target) => {
        const page = await target.page()
        if (page) {
            await page.exposeFunction('urlParse', urlParse)
            const url = target.url()

            if (url.match(/\/(pin)\//g)) {
                const xpath = '//div[@data-test-id="closeup-body-image-container"]'
                await page.waitForXPath(xpath)
                const [elements] = await page.$x(xpath)

                const result = await page.evaluate(async (element) => {
                    let img
                    img = element.querySelector('a').getAttribute('href')
                    const parse = await window.urlParse(img)

                    if (parse.hostname === 'i.pinimg.com') {
                        return img
                    }
                    img = element.querySelector('a > div > div > div > img').getAttribute('src')
                    return img
                }, elements)

                // log
                counter += 1
                let log = `COUNTER: ${counter}\n`
                log += `URL: ${url}\n`
                log += `Image URL: ${result}\n`
                log += '========================================\n'
                console.log(log)

                // save to .json
                let json = []
                const data = await fsPromise.readFile(filePath, 'utf-8')
                if (data) {
                    json = JSON.parse(data)
                    json = [...new Set(json)]
                }

                json.push(result)
                json = JSON.stringify(json, null, 2)
                await fsPromise.writeFile(filePath, json)
            }
        }
    })
})()
