function parseJwt(token) {
    try {
        const payload = atob(token.split('.')[1]);
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

const accessToken = localStorage.getItem('access');
const payload = parseJwt(accessToken);
const userId = payload?.user_id;
const userInfoDiv = document.getElementById('user-info');
const toggleButtons = document.getElementById('toggle-buttons');
const adsList = document.getElementById('ads-list');
const adModal = document.getElementById('ad-modal');
const adForm = document.getElementById('ad-form');
const modalTitle = document.getElementById('modal-title');
const saveBtn = document.getElementById('save-btn');
const deleteBtn = document.getElementById('delete-btn');
const exchangeForm = document.getElementById('exchange-form');
const myAdSelect = document.getElementById('my-ad-select');

const exchangeAdTitle = document.getElementById('exchange-ad-title');
let targetAdId = null;
let editingAdId = null;


if (payload) {
    userInfoDiv.innerHTML = `
        <p>Привет, <strong>${payload.email || 'Пользователь'}</strong>!</p>
        <button id="open-ad-modal">Добавить объявление</button>
        <button onclick="logout()">Выйти</button>
    `;
    toggleButtons.style.display = 'block';
    loadMyAds();
} else {
    userInfoDiv.innerHTML = `<a href="/login/">Войти</a> | <a href="/register/">Зарегистрироваться</a>`;
    loadAllAds();
}

function logout() {
    localStorage.clear();
    location.reload();
}

async function loadAds(url, withAuth = false, markMyAds = false) {
    try {
        const options = {};
        if (withAuth) {
            options.headers = {
                'Authorization': 'Bearer ' + accessToken
            };
        }

        const response = await fetch(url, options);
        if (!response.ok) throw new Error('Ошибка загрузки');

        const ads = await response.json();
        adsList.innerHTML = '';

        if (ads.length === 0) {
            adsList.innerHTML = '<p>Нет объявлений.</p>';
            return;
        }

        ads.forEach(ad => {
            const card = document.createElement('div');
            card.className = 'ad-card';

            if (ad.image_url) {
                card.innerHTML += `<img src="${ad.image_url}" alt="Изображение">`;
            }

            card.innerHTML += `
                <h3>${ad.title}</h3>
                <p class="categ"><strong>Категория:</strong> ${ad.category}</p>
                <p><strong>Состояние:</strong> ${ad.condition === 'new' ? 'Новый' : 'Б/У'}</p>
                <p>${ad.description.slice(0, 60)}${ad.description.length > 60 ? '...' : ''}</p>
            `;


            if (ad.user === userId) {
                card.classList.add('editable');
                const badge = document.createElement('div');
                badge.className = 'edit-badge';
                badge.textContent = 'Моё';
                card.appendChild(badge);
                card.addEventListener('click', () => openAdModal(ad.id));
            }
            else {
                card.addEventListener('click', () => openExchangeModal(ad));
            }

            adsList.appendChild(card);
        });
    } catch (err) {
        adsList.innerHTML = `<p style="color:red;">${err.message}</p>`;
    }
}

function loadAllAds() {
    loadAds('/ads/ads', false, false);
}

function loadMyAds() {
    loadAds('/ads/my-ads/', true, true);
}

document.getElementById('show-my-ads').onclick = loadMyAds;
document.getElementById('show-all-ads').onclick = loadAllAds;

document.addEventListener('click', e => {
    if (e.target.id === 'open-ad-modal') openAdModal();
    if (e.target.id === 'close-modal') closeAdModal();
});

async function openAdModal(id = null) {
    editingAdId = id;
    adForm.reset();
    if (id) {
        try {
            const res = await fetch(`/ads/${id}/`, {
                headers: { 'Authorization': 'Bearer ' + accessToken }
            });
            const ad = await res.json();
            if (ad.user !== userId) {
                alert('Вы не можете редактировать это объявление.');
                return;
            }
            modalTitle.textContent = 'Редактировать объявление';
            saveBtn.textContent = 'Сохранить';
            deleteBtn.style.display = 'inline-block';
            adForm.title.value = ad.title;
            adForm.description.value = ad.description;
            adForm.image_url.value = ad.image_url || '';
            adForm.category.value = ad.category;
            adForm.condition.value = ad.condition;
        } catch {
            alert('Ошибка при загрузке объявления');
            return;
        }
    } else {
        modalTitle.textContent = 'Добавить объявление';
        saveBtn.textContent = 'Опубликовать';
        deleteBtn.style.display = 'none';
    }
    adModal.classList.add('show');
}

function closeAdModal() {
    adModal.classList.remove('show');
    editingAdId = null;
}

adForm.addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
        title: adForm.title.value,
        description: adForm.description.value,
        image_url: adForm.image_url.value || null,
        category: adForm.category.value,
        condition: adForm.condition.value
    };
    try {
        let res;
        if (editingAdId) {
            res = await fetch(`/ads/${editingAdId}/update/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + accessToken
                },
                body: JSON.stringify(data)
            });
        } else {
            res = await fetch('/ads/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + accessToken
                },
                body: JSON.stringify(data)
            });
        }
        if (!res.ok) throw await res.json();
        alert(editingAdId ? 'Объявление обновлено!' : 'Объявление добавлено!');
        closeAdModal();
        loadMyAds();
    } catch (err) {
        alert('Ошибка: ' + (err.detail || JSON.stringify(err)));
    }
});

deleteBtn.addEventListener('click', async () => {
    if (!confirm('Удалить объявление?')) return;
    try {
        const res = await fetch(`/ads/${editingAdId}/delete/`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        if (!res.ok) throw new Error('Ошибка удаления');
        alert('Объявление удалено');
        closeAdModal();
        loadMyAds();
    } catch (err) {
        alert(err.message);
    }
});


async function openExchangeModal(ad) {
    try {
        const adRes = await fetch(`/ads/${ad.id}/`, {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        if (!adRes.ok) throw new Error('Ошибка загрузки объявления');
        const adDetails = await adRes.json();

        const userAdsRes = await fetch(`/ads/my-ads/`, {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        if (!userAdsRes.ok) throw new Error('Ошибка загрузки ваших объявлений');
        const myAds = await userAdsRes.json();

        if (!Array.isArray(myAds)) {
            throw new Error('Некорректный формат данных');
        }

        targetAdId = ad.id;

        exchangeAdTitle.textContent = `Объявление: ${adDetails.title}`;
        exchangeForm.comment.value = '';

        myAdSelect.innerHTML = '';
        myAds.forEach(myAd => {
            const opt = document.createElement('option');
            opt.value = myAd.id;
            opt.textContent = myAd.title;
            myAdSelect.appendChild(opt);
        });

        exchangeModal.classList.add('show');
    } catch (err) {
        alert('Ошибка: ' + err.message);
    }
}

document.getElementById('close-exchange-modal').onclick = () => {
    exchangeModal.classList.remove('show');
};

exchangeForm.addEventListener('submit', async e => {
    e.preventDefault();

    const data = {
        ad_sender_id: myAdSelect.value,
        ad_receiver_id: targetAdId,
        comment: exchangeForm.comment.value,
    };

    try {
        const res = await fetch('/ads/exchange/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw await res.json();

        alert('Предложение отправлено!');
        exchangeModal.classList.remove('show');
    } catch (err) {
        alert('Ошибка: ' + (err.detail || JSON.stringify(err)));
    }
});



const sentOffersList = document.getElementById('sent-offers-list');
const receivedOffersList = document.getElementById('received-offers-list');
const exchangeOffersModal = document.getElementById('exchange-offers-modal');
const exchangeModal = document.getElementById('exchange-modal');
const tabSent = document.getElementById('tab-sent');
const tabReceived = document.getElementById('tab-received');
const closedOffersList = document.getElementById('closed-offers-list');
const tabClosed = document.getElementById('tab-closed');



document.getElementById('close-exchange-offers-modal').onclick = () => {
    exchangeOffersModal.classList.remove('show');
};

document.getElementById('show-my-exchanges').onclick = () => {
    loadExchangeOffers();
};

tabSent.onclick = () => {
    tabSent.classList.add('active-tab');
    tabReceived.classList.remove('active-tab');
    tabClosed.classList.remove('active-tab');
    sentOffersList.style.display = 'block';
    receivedOffersList.style.display = 'none';
    closedOffersList.style.display = 'none';
};

tabReceived.onclick = () => {
    tabSent.classList.remove('active-tab');
    tabReceived.classList.add('active-tab');
    tabClosed.classList.remove('active-tab');
    sentOffersList.style.display = 'none';
    receivedOffersList.style.display = 'block';
    closedOffersList.style.display = 'none';
};

tabClosed.onclick = () => {
    tabSent.classList.remove('active-tab');
    tabReceived.classList.remove('active-tab');
    tabClosed.classList.add('active-tab');
    sentOffersList.style.display = 'none';
    receivedOffersList.style.display = 'none';
    closedOffersList.style.display = 'block';
}


async function loadExchangeOffers() {
    try {
        const resSent = await fetch('/ads/exchange/sent/', {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        const sentOffers = await resSent.json();

        const resReceived = await fetch('/ads/exchange/received/', {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        const receivedOffers = await resReceived.json();

        sentOffersList.innerHTML = '';
        receivedOffersList.innerHTML = '';
        closedOffersList.innerHTML = '';
        const closedOffers = sentOffers.concat(receivedOffers).filter(offer => offer.status === 'accepted' || offer.status === 'rejected');
        const sentActive = sentOffers.filter(offer => offer.status === 'pending');
        if (sentActive.length === 0) {
            sentOffersList.innerHTML = '<p>Нет отправленных предложений</p>';
        } else {
            sentActive.forEach(offer => {
                const div = createOfferCard(offer, true);
                sentOffersList.appendChild(div);
            });
        }
        const receivedActive = receivedOffers.filter(offer => offer.status === 'pending');
        if (receivedActive.length === 0) {
            receivedOffersList.innerHTML = '<p>Нет полученных предложений</p>';
        } else {
            receivedActive.forEach(offer => {
                const div = createOfferCard(offer, false);
                receivedOffersList.appendChild(div);
            });
        }

        if (closedOffers.length === 0) {
            closedOffersList.innerHTML = '<p>Нет закрытых сделок</p>';
        } else {
            closedOffers.forEach(offer => {
                const div = createOfferCard(offer, false);
                closedOffersList.appendChild(div);
            });
        }

        exchangeOffersModal.classList.add('show');
        tabSent.click();
    } catch (error) {
        alert('Ошибка загрузки предложений: ' + error.message);
    }
}
function createOfferCard(offer, sent) {
    const div = document.createElement('div');
    div.className = 'exchange-offer-card';

    let yourAd, theirAd;

    const isClosed = (offer.status === 'accepted' || offer.status === 'rejected');

    if (isClosed) {
        yourAd = offer.ad_receiver;
        theirAd = offer.ad_sender;
    } else {
        if (sent) {
            yourAd = offer.ad_sender;
            theirAd = offer.ad_receiver;
        } else {
            yourAd = offer.ad_sender;
            theirAd = offer.ad_receiver;
        }
    }

    const title = document.createElement('h3');
    if (isClosed) {
        title.textContent = 'Закрытая сделка';
    } else {
        title.textContent = sent ? 'Вы предложили обмен' : 'Вам предлагают обмен';
    }
    div.appendChild(title);

    function createAdSection(label, ad) {
        const section = document.createElement('div');

        const labelElem = document.createElement('p');
        labelElem.innerHTML = `<strong>${label}</strong>`;
        section.appendChild(labelElem);

        if (ad && ad.image_url) {
            const img = document.createElement('img');
            img.src = ad.image_url;
            img.alt = ad.title || 'Фото объявления';
            section.appendChild(img);
        }

        const adTitle = document.createElement('p');
        adTitle.innerHTML = `<strong>Название:</strong> ${ad?.title || '—'}`;
        section.appendChild(adTitle);

        const category = document.createElement('p');
        category.innerHTML = `<strong>Категория:</strong> ${ad?.category || '—'}`;
        section.appendChild(category);

        const condition = document.createElement('p');
        condition.innerHTML = `<strong>Состояние:</strong> ${ad?.condition === 'new' ? 'Новый' : 'Б/У'}`;
        section.appendChild(condition);

        return section;
    }

    if (isClosed) {

        div.appendChild(createAdSection('Ваше объявление:', yourAd));
        div.appendChild(createAdSection('Объявление партнёра:', theirAd));
    } else {
        div.appendChild(createAdSection(sent ? 'Вы предлагаете:' : 'Вам предлагают:', yourAd));
        div.appendChild(createAdSection('В обмен на:', theirAd));
    }

    // Комментарий и статус
    const infoList = document.createElement('div');

    function addInfo(label, value) {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${label}:</strong> ${value || '—'}`;
        infoList.appendChild(p);
    }

    addInfo('Комментарий', offer.comment);
    addInfo('Статус', mapStatus(offer.status));

    div.appendChild(infoList);

    if (!sent && offer.status === 'pending') {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'exchange-btn-group';

        const acceptBtn = document.createElement('button');
        acceptBtn.textContent = 'Принять';
        acceptBtn.className = 'accept-btn';
        acceptBtn.onclick = () => respondOffer(offer.id, 'accepted');

        const rejectBtn = document.createElement('button');
        rejectBtn.textContent = 'Отклонить';
        rejectBtn.className = 'reject-btn';
        rejectBtn.onclick = () => respondOffer(offer.id, 'rejected');

        buttonsContainer.appendChild(acceptBtn);
        buttonsContainer.appendChild(rejectBtn);
        div.appendChild(buttonsContainer);
    }

    return div;
}



function mapStatus(status) {
    switch (status) {
        case 'pending': return 'В ожидании';
        case 'accepted': return 'Принято';
        case 'rejected': return 'Отклонено';
        default: return status;
    }
}

async function respondOffer(offerId, status) {
    try {
        const res = await fetch(`/ads/exchanges/${offerId}/respond/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            },
            body: JSON.stringify({ status })
        });
        if (!res.ok) {
            alert('Ошибка отправки ответа');
            return;
        }
        loadExchangeOffers();
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadAllAds();
    const categorySelect = document.getElementById('filter-category');
    const conditionSelect = document.getElementById('filter-condition');
    const adsList = document.getElementById('ads-list');

    function collectCategories() {
        const cards = adsList.querySelectorAll('.ad-card');
        const categories = new Set();
        cards.forEach(card => {
            const catElem = card.querySelector('.categ');
            if (catElem) {
                const cat = catElem.textContent.replace('Категория:', '').trim();
                if (cat) categories.add(cat);
            }
        });
        return Array.from(categories).sort();
    }

    function populateCategoryFilter() {
        const categories = collectCategories();
        categorySelect.innerHTML = '<option value="">Все категории</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });
    }

    async function fetchAndRenderAds() {
        const selectedCategory = categorySelect.value;
        const selectedCondition = conditionSelect.value;

        const params = new URLSearchParams();
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedCondition) params.append('condition', selectedCondition);

        let url = '/ads/filter';
        if (params.toString()) {
            url += '?' + params.toString();
        }

        try {
            const options = {};
            const response = await fetch(url, options);
            if (!response.ok) throw new Error('Ошибка загрузки');

            const ads = await response.json();
            adsList.innerHTML = '';

            if (ads.length === 0) {
                adsList.innerHTML = '<p>Нет объявлений.</p>';
                return;
            }

            ads.forEach(ad => {
                const card = document.createElement('div');
                card.className = 'ad-card';

                if (ad.image_url) {
                    card.innerHTML += `<img src="${ad.image_url}" alt="Изображение">`;
                }

                card.innerHTML += `
                    <h3>${ad.title}</h3>
                    <p class="categ"><strong>Категория:</strong> ${ad.category}</p>
                    <p><strong>Состояние:</strong> ${ad.condition === 'new' ? 'Новый' : 'Б/У'}</p>
                    <p>${ad.description.slice(0, 60)}${ad.description.length > 60 ? '...' : ''}</p>
                `;

                if (ad.user === userId) {
                    card.classList.add('editable');
                    const badge = document.createElement('div');
                    badge.className = 'edit-badge';
                    badge.textContent = 'Моё';
                    card.appendChild(badge);
                    card.addEventListener('click', () => openAdModal(ad.id));
                } else {
                    card.addEventListener('click', () => openExchangeModal(ad));
                }

                adsList.appendChild(card);
            });

            conditionSelect.value = selectedCondition;

        } catch (err) {
            adsList.innerHTML = `<p style="color:red;">${err.message}</p>`;
        }
    }

    fetchAndRenderAds().then(() => {
        populateCategoryFilter();
    });


    categorySelect.addEventListener('change', fetchAndRenderAds);
    conditionSelect.addEventListener('change', fetchAndRenderAds);
});
