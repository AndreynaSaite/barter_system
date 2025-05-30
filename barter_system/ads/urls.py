from django.urls import path
from .views import AdCreateView, UserAdsListView, AdUpdateView, AdDeleteView, AdDetailView, AdsListView, ExchangeOfferCreateView, SentExchangeOffersView, ReceivedExchangeOffersView, ExchangeOfferRespondView, FilteredAdsListView

urlpatterns = [
    path('create/', AdCreateView.as_view(), name='ad-create'),
    path('my-ads/', UserAdsListView.as_view(), name='my_ads'),
    path('ads/', AdsListView.as_view(), name="ads"),
    path('<int:pk>/update/', AdUpdateView.as_view(), name='ad_update'),
    path('<int:pk>/delete/', AdDeleteView.as_view(), name='ad_delete'),
    path('<int:pk>/', AdDetailView.as_view()),
    path('exchange/create/', ExchangeOfferCreateView.as_view(), name='create-view'),
    path('exchange/sent/', SentExchangeOffersView.as_view(), name='exchange-sent'),
    path('exchange/received/', ReceivedExchangeOffersView.as_view(), name='exchange-received'),
    path('exchanges/<int:offer_id>/respond/', ExchangeOfferRespondView.as_view(), name='exchange-offer-respond'),
    path('filter/', FilteredAdsListView.as_view(), name='filtered-ads-list'),
]
