const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const sectionsContainer = document.getElementById('sections-container');
const sectionTemplate = document.getElementById('section-template');
const simpleItemTemplate = document.getElementById('simple-item-template');
const menuItemTemplate = document.getElementById('menu-item-template');

let currentMenu = null;

async function checkSession() {
    const res = await fetch('/api/session');
    const data = await res.json();
    if (data.loggedIn) {
        showAdmin();
    } else {
        loginView.style.display = 'block';
        adminView.style.display = 'none';
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const password = document.getElementById('password').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    if (res.ok) {
        showAdmin();
    } else {
        const data = await res.json().catch(() => ({}));
        loginError.textContent = data.error || 'No se pudo iniciar sesión';
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    loginView.style.display = 'block';
    adminView.style.display = 'none';
});

async function showAdmin() {
    loginView.style.display = 'none';
    adminView.style.display = 'block';
    const res = await fetch('/api/menu');
    currentMenu = await res.json();
    renderAdminForm();
}

function renderAdminForm() {
    document.getElementById('header-title').value = currentMenu.header.title;
    document.getElementById('header-slogan').value = currentMenu.header.slogan;
    document.getElementById('contact-address').value = currentMenu.contact.address;
    document.getElementById('contact-whatsapp').value = currentMenu.contact.whatsapp;
    document.getElementById('contact-instagram').value = currentMenu.contact.instagram;
    document.getElementById('contact-facebook').value = currentMenu.contact.facebook;

    sectionsContainer.innerHTML = '';
    currentMenu.sections.forEach(section => addSectionBlock(section));
}

function addSectionBlock(section) {
    const node = sectionTemplate.content.cloneNode(true);
    const block = node.querySelector('.admin-section-block');
    block.dataset.id = section.id || `s${Date.now()}${Math.random()}`;

    block.querySelector('.section-title-input').value = section.title || '';
    block.querySelector('.section-type-select').value = section.type || 'simple';
    block.querySelector('.section-image-input').value = section.image || '';

    const itemsContainer = block.querySelector('.items-container');
    (section.items || []).forEach(item => addItemRow(itemsContainer, block.querySelector('.section-type-select').value, item));

    block.querySelector('.add-item-btn').addEventListener('click', () => {
        const type = block.querySelector('.section-type-select').value;
        addItemRow(itemsContainer, type, type === 'menu' ? { name: '', price: '', desc: '' } : '');
    });

    block.querySelector('.section-type-select').addEventListener('change', (e) => {
        itemsContainer.innerHTML = '';
    });

    block.querySelector('.remove-section-btn').addEventListener('click', () => {
        block.remove();
    });

    sectionsContainer.appendChild(block);
}

function addItemRow(container, type, item) {
    if (type === 'menu') {
        const node = menuItemTemplate.content.cloneNode(true);
        const row = node.querySelector('.admin-item-row-menu');
        row.querySelector('.item-name-input').value = item.name || '';
        row.querySelector('.item-price-input').value = item.price || '';
        row.querySelector('.item-desc-input').value = item.desc || '';
        row.querySelector('.remove-item-btn').addEventListener('click', () => row.remove());
        container.appendChild(row);
    } else {
        const node = simpleItemTemplate.content.cloneNode(true);
        const row = node.querySelector('.admin-item-row');
        row.querySelector('.item-text-input').value = typeof item === 'string' ? item : '';
        row.querySelector('.remove-item-btn').addEventListener('click', () => row.remove());
        container.appendChild(row);
    }
}

document.getElementById('add-section-btn').addEventListener('click', () => {
    addSectionBlock({ id: '', title: '', type: 'simple', image: '', items: [] });
});

function collectMenuFromForm() {
    const sections = Array.from(sectionsContainer.querySelectorAll('.admin-section-block')).map(block => {
        const type = block.querySelector('.section-type-select').value;
        const title = block.querySelector('.section-title-input').value.trim();
        const image = block.querySelector('.section-image-input').value.trim() || null;
        const id = block.dataset.id || title.toLowerCase().replace(/\s+/g, '-');

        let items;
        if (type === 'menu') {
            items = Array.from(block.querySelectorAll('.admin-item-row-menu')).map(row => ({
                name: row.querySelector('.item-name-input').value.trim(),
                price: row.querySelector('.item-price-input').value.trim(),
                desc: row.querySelector('.item-desc-input').value.trim()
            })).filter(it => it.name);
        } else {
            items = Array.from(block.querySelectorAll('.admin-item-row:not(.admin-item-row-menu)')).map(row =>
                row.querySelector('.item-text-input').value.trim()
            ).filter(Boolean);
        }

        return { id, title, type, image, items };
    }).filter(s => s.title);

    return {
        header: {
            title: document.getElementById('header-title').value.trim(),
            slogan: document.getElementById('header-slogan').value.trim()
        },
        sections,
        contact: {
            address: document.getElementById('contact-address').value.trim(),
            whatsapp: document.getElementById('contact-whatsapp').value.trim().replace(/\D/g, ''),
            instagram: document.getElementById('contact-instagram').value.trim().replace(/^@/, ''),
            facebook: document.getElementById('contact-facebook').value.trim()
        },
        qr: currentMenu.qr
    };
}

document.getElementById('save-btn').addEventListener('click', async () => {
    const status = document.getElementById('save-status');
    status.textContent = 'Guardando…';
    status.style.color = '#ffcc00';

    const menu = collectMenuFromForm();
    const res = await fetch('/api/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menu)
    });

    if (res.ok) {
        currentMenu = menu;
        status.textContent = 'Cambios guardados correctamente.';
        status.style.color = '#7ed957';
    } else {
        const data = await res.json().catch(() => ({}));
        status.textContent = data.error || 'Error al guardar.';
        status.style.color = '#ff5555';
    }
});

document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('password-status');
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;

    const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
        status.textContent = 'Contraseña actualizada.';
        status.style.color = '#7ed957';
        e.target.reset();
    } else {
        status.textContent = data.error || 'Error al actualizar contraseña.';
        status.style.color = '#ff5555';
    }
});

checkSession();
