function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderSection(section) {
    const imgHtml = section.image
        ? `<img src="${escapeHtml(section.image)}" alt="${escapeHtml(section.title)}" class="section-img">`
        : '';

    let listHtml;
    if (section.type === 'menu') {
        listHtml = `<ul class="menu-list">${section.items.map(item => `
            <li class="menu-item">
                <div class="item-row">
                    <span class="item-name">${escapeHtml(item.name)}</span>
                    <span class="item-price">${escapeHtml(item.price)}</span>
                </div>
                ${item.desc ? `<p class="item-desc">${escapeHtml(item.desc)}</p>` : ''}
            </li>`).join('')}</ul>`;
    } else {
        listHtml = `<ul>${section.items.map(text => `<li>${escapeHtml(text)}</li>`).join('')}</ul>`;
    }

    return `<section class="section">
        <h2>${escapeHtml(section.title)}</h2>
        ${imgHtml}
        ${listHtml}
    </section>`;
}

function renderContact(contact) {
    return `<section class="section info">
        <h2>Ubicación y contacto</h2>
        <p><strong>Dirección:</strong> ${escapeHtml(contact.address)}</p>
        <p><strong>WhatsApp:</strong> <a href="https://wa.me/${escapeHtml(contact.whatsapp)}" target="_blank" rel="noopener">+${escapeHtml(contact.whatsapp)}</a></p>
        <p><strong>Instagram:</strong> <a href="https://instagram.com/${escapeHtml(contact.instagram)}" target="_blank" rel="noopener">@${escapeHtml(contact.instagram)}</a></p>
        <p><strong>Facebook:</strong> <a href="https://facebook.com/${escapeHtml(contact.facebook)}" target="_blank" rel="noopener">Deli Locura</a></p>
    </section>`;
}

function renderQr(qr, contact) {
    let html = '';
    if (qr.menu) {
        html += `<section class="section qr-section">
            <h2>Escanea el menú</h2>
            <p>Escanea este código QR para ver el menú en tu celular:</p>
            <img src="${escapeHtml(qr.menu)}" alt="Código QR del menú" class="qr">
        </section>`;
    }
    if (qr.whatsapp) {
        html += `<section class="section qr-section">
            <h2>Pide por WhatsApp</h2>
            <p>Escanea este código QR para escribirnos directo por WhatsApp:</p>
            <a href="https://wa.me/${escapeHtml(contact.whatsapp)}" target="_blank" rel="noopener">
                <img src="${escapeHtml(qr.whatsapp)}" alt="Código QR de WhatsApp" class="qr">
            </a>
        </section>`;
    }
    return html;
}

async function loadMenu() {
    const container = document.getElementById('menu-container');
    try {
        const res = await fetch('/api/menu');
        if (!res.ok) throw new Error('No se pudo cargar el menú');
        const menu = await res.json();

        document.getElementById('site-title').textContent = menu.header.title;
        document.getElementById('site-slogan').textContent = menu.header.slogan;
        document.title = menu.header.title;

        const sectionsHtml = menu.sections.map(renderSection).join('');
        container.innerHTML = sectionsHtml + renderContact(menu.contact) + renderQr(menu.qr, menu.contact);
    } catch (err) {
        container.innerHTML = '<p style="text-align:center;">No se pudo cargar el menú. Intenta de nuevo más tarde.</p>';
        console.error(err);
    }
}

loadMenu();
