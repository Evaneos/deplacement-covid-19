import './main.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import { PDFDocument } from 'pdf-lib';
import { sprintf } from 'sprintf-js';

import AUT from './templates/AUT.txt';
import BEL from './templates/BEL.txt';
import CAN from './templates/CAN.txt';
import CHE from './templates/CHE.txt';
import ESP from './templates/ESP.txt';
import FRA from './templates/FRA.txt';
import GBR from './templates/GBR.txt';
import GER from './templates/GER.txt';
import ITA from './templates/ITA.txt';
import NLD from './templates/NLD.txt';
import USA from './templates/USA.txt';

const defaultMarket = 'other';
const marketMap = {
    fr: { template: FRA, locale: 'fr-FR', dateFormat: 'jj/mm/aaaa' },
    it: { template: ITA, locale: 'it-IT', dateFormat: 'jj/mm/aaa' },
    es: { template: ESP, locale: 'es-ES', dateFormat: 'jj/mm/aaa' },
    de: { template: GER, locale: 'de-DE', dateFormat: 'jj/mm/aaa' },
    be: { template: BEL, locale: 'fr-BE', dateFormat: 'jj/mm/aaa' },
    nl: { template: NLD, locale: 'nl-NL', dateFormat: 'jj/mm/aaa' },
    ch: { template: CHE, locale: 'fr-CH', dateFormat: 'jj/mm/aaa' },
    at: { template: AUT, locale: 'de-AT', dateFormat: 'jj/mm/aaa' },
    uk: { template: GBR, locale: 'en-GB', dateFormat: 'jj/mm/aaa' },
    ca: { template: CAN, locale: 'en-CA', dateFormat: 'mm/dd/yyyy' },
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

async function drawLogo(pdf, logo, margin) {
    if (logo instanceof File === false) {
        return;
    }

    let embedMethod;
    switch (logo.type) {
        case 'image/png':
            embedMethod = 'embedPng';
            break;
        case 'image/jpg':
        case 'image/jpeg':
            embedMethod = 'embedJpg';
            break;
    }

    const buffer = await logo.arrayBuffer();
    const embeddedLogo = await pdf[embedMethod](buffer);

    const { height, width } = embeddedLogo;

    const size = 120;
    const factor = Math.max(width / size, height / size);
    const [tWidth, tHeight] = [width / factor, height / factor];

    for (let page of pdf.getPages()) {
        page.drawImage(embeddedLogo, {
            x: page.getWidth() - tWidth - margin,
            y: page.getHeight() - tHeight - margin,
            width: tWidth,
            height: tHeight,
        });
    }
}

async function drawText(pdf, market, formData, margin) {
    const template = await (await fetch(market.template)).text();

    const doc = sprintf(template, {
        ...formData,
        creation_date: new Date().toLocaleDateString(market.locale),
        date_format: market.dateFormat,
    })
        .replace(/\n/g, ' \n')
        .split('---');

    for (let text of doc) {
        const page = pdf.addPage();
        page.drawText(text.trim(), {
            x: margin,
            y: page.getHeight() - margin,
            maxWidth: page.getWidth() - margin * 2,
            size: 12,
            lineHeight: 15,
        });
    }
}

async function generateVoucherPdf(market, formData) {
    const pdf = await PDFDocument.create();
    const margin = 60;

    await drawText(pdf, market, formData, margin);

    if (formData.logo instanceof File && formData.logo.size > 0) {
        try {
            await drawLogo(pdf, formData.logo, margin);
        } catch (error) {
            console.error(error);
        }
    }

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

function fetchFormParamFromLocation(location) {
    if (location.search === '') {
        return [];
    }

    return decodeURIComponent(location.search)
        .replace('?', '')
        .split('&')
        .map((p) => p.split('='));
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

fetchFormParamFromLocation(document.location).forEach((q) => {
    form.elements[q[0]].value = q[1];
});
