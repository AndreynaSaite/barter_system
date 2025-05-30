# barter_system/ads/tests/conftest.py
import pytest
from django.contrib.auth import get_user_model
from ads.models import Ad, ExchangeOffer

User = get_user_model()

@pytest.fixture
def user_1(db):
    return User.objects.create_user(email="user1@example.com", password="pass")

@pytest.fixture
def user_2(db):
    return User.objects.create_user(email="user2@example.com", password="pass")

@pytest.fixture
def ad_1(user_1):
    return Ad.objects.create(
        user=user_1,
        title="Ad 1",
        description="desc 1",
        category="cat1",
        condition="new"
    )

@pytest.fixture
def ad_2(user_2):
    return Ad.objects.create(
        user=user_2,
        title="Ad 2",
        description="desc 2",
        category="cat1",
        condition="new"
    )

@pytest.fixture
def exchange_offer(user_1, user_2, ad_1, ad_2):
    return ExchangeOffer.objects.create(
        ad_sender=ad_1,
        ad_receiver=ad_2,
        user_sender=user_1,
        user_receiver=user_2,
        comment="Want to exchange"
    )
