import './check-updates';
import './icons';
import './main.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { PDFDocument, StandardFonts } from 'pdf-lib';
import { sprintf } from 'sprintf-js';

import FRA from './FRA.txt';
import USA from './USA.txt';

const defaultMarket = 'other';
const marketMap = {
    fr: { template: FRA, locale: 'fr-FR', dateFormat: 'jj/mm/aaaa' },
    us: { template: USA, locale: 'en-US', dateFormat: 'mm/dd/yyyy' },
    other: { template: USA, locale: 'en-US', dateFormat: 'mm/dd/yyyy' },
};

function serializeFormData(market, formData) {
    return Array.from(formData).reduce((entries, entry) => {
        if (entry[0].match(/-date/)) {
            entry[1] = new Date(entry[1]).toLocaleDateString(market.locale);
        }
        return { ...entries, [entry[0].replace(/-/g, '_')]: entry[1] };
    }, {});
}

async function drawLogo(pdf, page, logo, margin) {
    if (logo instanceof File === false) {
        return;
    }

    let embedMethod;
    switch (logo.type) {
        case 'image/png':
            embedMethod = 'embedPng';
            break;
        case 'image/jpg':
            embedMethod = 'embedJpeg';
            break;
    }

    const buffer = await logo.arrayBuffer();
    const embeddedLogo = await pdf[embedMethod](buffer);

    const { height, width } = embeddedLogo;

    const size = 120;
    const factor = Math.max(width / size, height / size);
    const [tWidth, tHeight] = [width / factor, height / factor];

    page.drawImage(embeddedLogo, {
        x: page.getWidth() - tWidth - margin,
        y: page.getHeight() - tHeight - margin,
        width: tWidth,
        height: tHeight,
    });
}

async function drawText(pdf, page, market, formData, margin) {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const template = await (await fetch(market.template)).text();

    const text = sprintf(template, {
        ...formData,
        creation_date: new Date().toLocaleDateString(market.locale),
        date_format: market.dateFormat,
    }).replace(/\n/g, ' \n');

    page.moveTo(margin, page.getHeight() - margin);
    page.drawText(text, {
        maxWidth: page.getWidth() - margin * 2,
        size: 12,
        lineHeight: 15,
        font,
    });
}

async function generateVoucherPdf(market, formData) {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    const margin = 60;

    if (formData.logo instanceof File) {
        await drawLogo(pdf, page, formData.logo, margin);
    }

    await drawText(pdf, page, market, formData, margin);

    return new Blob([await pdf.save()], { type: 'application/pdf' });
}

function downloadBlob(blob, fileName) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
}

function notifyDownload() {
    const snackbar = document.getElementById('snackbar');
    snackbar.classList.remove('d-none');
    setTimeout(() => snackbar.classList.add('show'), 100);

    setTimeout(function () {
        snackbar.classList.remove('show');
        setTimeout(() => snackbar.classList.add('d-none'), 500);
    }, 6000);
}

const form = document.getElementById('information');
form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();

    const formData = new FormData(submitEvent.target);
    const countryOrigin = formData.get('country-origin');

    let market = marketMap[countryOrigin];
    if (market === undefined) {
        console.error(
            sprintf(
                'Market %s does not exists, default to %s',
                countryOrigin,
                defaultMarket
            )
        );
        market = marketMap[defaultMarket];
    }

    const now = new Date();
    const data = serializeFormData(market, formData);
    const pdfBlob = await generateVoucherPdf(market, data);

    const creationDate = now.toLocaleDateString('en-US');
    const creationHour = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
    downloadBlob(pdfBlob, `voucher-${creationDate}_${creationHour}.pdf`);
    notifyDownload();
});
