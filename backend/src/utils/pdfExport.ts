import { Types } from 'mongoose';
import puppeteer from "puppeteer";
import userModel from '../api/models/userModel.js';

export async function pdfExport(title: string, body: string, docName: string, authNames: Types.ObjectId[], curVersion: string) {
    var names:string[] = await Promise.all(authNames.map(async id => {
        return (await userModel.findById(id).select("email"))?.email!
    }))
    
    
    const browser = await puppeteer.launch({headless:"new"});
    const page = await browser.newPage();
    const space = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
    const header = `
    <style>
        header{
            display: flex;
            gap: 1rem;
            position: relative;
            justify-content:center;
            align-items:center;
            width: 100%;
        }
        header div{
            flex:1;
            display: flex;
            flex-wrap: wrap;
            align-items:center;
            font-size:16px;
            font-weight:600;
        }
    </style>
    <header>
        <div>
            ${global.masterData.export.header.docName?`<p>Title: ${docName}</p>${space}`:''}
            ${global.masterData.export.header.AuthName?`<p>Author Name: ${names.join('<br>')}</p>${space}`:''}
            ${global.masterData.export.header.CurVersion?`<p>Current Version: ${curVersion}</p>${space}`:''}
            ${global.masterData.export.header.orgName?`<p>Org. Name: ${masterData.OrgDetails.name}</p>`:''}
            ${global.masterData.export.header.IFL?`<p>IFL: ${masterData.OrgDetails.IFL}</p>${space}`:''}
        </div>
    </header>
    `
    const footer = `
    <header>
        <div>
            ${global.masterData.export.footer.docName?`<p>Title: ${docName}</p>${space}`:''}
            ${global.masterData.export.footer.AuthName?`<p>Author Name: ${names.join('<br>')}</p>${space}`:''}
            ${global.masterData.export.footer.CurVersion?`<p>Current Version: ${curVersion}</p>${space}`:''}
            ${global.masterData.export.footer.orgName?`<p>Org. Name: ${masterData.OrgDetails.name}</p>${space}`:''}
            ${global.masterData.export.footer.IFL?`<p>IFL: ${masterData.OrgDetails.IFL}</p>${space}`:''}
        </div>
    </header>
    `

    const pageHTML = `
    <div style="width:100%;text-align:right;font-size:12px;margin-right:1rem;">
        <i><span class="pageNumber"></span> | <span class="totalPages"></span></i>
    </div>
    `
    
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title></title>
    </head>
    <body>
        ${header}
        <div>
            ${body}
        </div>
        ${footer}
    </body>
    </html>`;
    
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.emulateMediaType("screen");
    const pdf = await page.pdf({
        margin: { top: "10px", right: "50px", bottom: "10px", left: "50px" },
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: masterData.export.header.pageNum ? pageHTML: '',
        footerTemplate: masterData.export.footer.pageNum ? pageHTML: '',
    });
    await browser.close();
    return pdf.buffer

}

export async function exportPdfFromString(csv: string) {
    const browser = await puppeteer.launch({headless:"new"});
    const page = await browser.newPage();
    const space = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
    const header = `
    <style>
        header{
            display: flex;
            gap: 1rem;
            position: relative;
            justify-content:center;
            align-items:center;
            width: 100%;
        }
        header div{
            flex:1;
            display: flex;
            flex-wrap: wrap;
            align-items:center;
            font-size:16px;
            font-weight:600;
        }
    </style>
    <header>
        <div>
            ${global.masterData.export.header.orgName?`<p>Org. Name: ${masterData.OrgDetails.name}</p>`:''}
        </div>
    </header>
    `
    const footer = `
    <header>
        <div>
            ${global.masterData.export.footer.orgName?`<p>Org. Name: ${masterData.OrgDetails.name}</p>${space}`:''}
        </div>
    </header>
    `

    const pageHTML = `
    <div style="width:100%;text-align:right;font-size:12px;margin-right:1rem;">
        <i><span class="pageNumber"></span> | <span class="totalPages"></span></i>
    </div>
    `
    var dataList = csv.split("\n")

    const body = `
        <table border="1" cellspacing="5">
            <tr>
                ${dataList.shift()?.split(',').map(_d=>`<th>${_d}</th>`).join("")}
            </tr>
            ${dataList.map(_row=>`<tr>${_row.split(',').map(_d=>`<td>${_d}</td>`).join('')}</tr>`).join('')}
        </table>
    `
    
    const html = `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title></title>
    </head>
    
    <body>
        <style>
            html,
            body {
                height: 100%;
                width: 100%;
                margin: 0;
                padding: 0;
            }
        </style>
        <div style="display:flex;flex-direction:column;min-height: 100%;">
            ${header}
            <div style="flex:1 1 0%;height: 100%;">
                ${body}
            </div>
            ${footer}
        </div>
    </body>
    
    </html>`;
    
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.emulateMediaType("screen");
    const pdf = await page.pdf({
        margin: { top: "10px", right: "10px", bottom: "10px", left: "10px" },
        printBackground: true,
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: masterData.export.header.pageNum ? pageHTML: '',
        footerTemplate: masterData.export.footer.pageNum ? pageHTML: '',
    });
    await browser.close();
    return pdf.buffer

}


