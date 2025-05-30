import pytest
from django.urls import reverse
from rest_framework import status

@pytest.mark.django_db
def test_get_all_ads_returns_success_and_multiple_ads(api_client, ad_1, ad_2):
    url = reverse('ads')
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) >= 2


@pytest.mark.django_db
def test_get_user_ads_returns_only_users_ads(api_client, user_1, ad_1, ad_2):
    api_client.force_authenticate(user=user_1)
    url = reverse('my_ads')
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert all(ad['user'] == user_1.id for ad in response.data)


@pytest.mark.django_db
def test_patch_ad_updates_ad_title(api_client, user_1, ad_1):
    api_client.force_authenticate(user=user_1)
    url = reverse('ad_update', kwargs={'pk': ad_1.id})
    data = {"title": "Updated title"}
    response = api_client.patch(url, data)
    assert response.status_code == status.HTTP_200_OK
    ad_1.refresh_from_db()
    assert ad_1.title == "Updated title"


@pytest.mark.django_db
def test_delete_ad_returns_204(api_client, user_1, ad_1):
    api_client.force_authenticate(user=user_1)
    url = reverse('ad_delete', kwargs={'pk': ad_1.id})
    response = api_client.delete(url)
    assert response.status_code == status.HTTP_204_NO_CONTENT



@pytest.mark.django_db
def test_create_exchange_offer_returns_201(api_client, user_1, ad_1, ad_2):
    api_client.force_authenticate(user=user_1)
    url = reverse('create-view')
    data = {
        "ad_sender_id": ad_1.id,
        "ad_receiver_id": ad_2.id
    }
    response = api_client.post(url, data)
    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_get_sent_exchange_offers_returns_200(api_client, user_1, exchange_offer):
    api_client.force_authenticate(user=user_1)
    url = reverse('exchange-sent')
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_get_received_exchange_offers_returns_200(api_client, user_2, exchange_offer):
    api_client.force_authenticate(user=user_2)
    url = reverse('exchange-received')
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_respond_to_exchange_offer_accept(api_client, user_2, exchange_offer):
    api_client.force_authenticate(user=user_2)
    url = reverse('exchange-offer-respond', kwargs={'offer_id': exchange_offer.id})
    data = {'status': 'accepted'}
    response = api_client.post(url, data)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_filtered_ads_list_returns_filtered_results(api_client, ad_1, ad_2):
    url = reverse('filtered-ads-list') + '?category=cat1&condition=new'
    response = api_client.get(url)
    assert response.status_code == status.HTTP_200_OK
