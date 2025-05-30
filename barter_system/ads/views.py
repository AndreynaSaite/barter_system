from django.shortcuts import get_object_or_404, render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Ad, ExchangeOffer
from .serializers import AdSerializer, ExchangeOfferSerializer


class AdCreateView(generics.CreateAPIView):
    queryset = Ad.objects.all()
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AdsListView(generics.ListAPIView):
    serializer_class = AdSerializer
    permission_classes = []

    def get_queryset(self):
        return Ad.objects.all()

class UserAdsListView(generics.ListAPIView):
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Ad.objects.filter(user=self.request.user)
    
class AdUpdateView(generics.UpdateAPIView):
    queryset = Ad.objects.all()
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        ad = super().get_object()
        if ad.user != self.request.user:
            raise PermissionDenied("Вы не можете редактировать чужое объявление.")
        return ad

class AdDeleteView(generics.DestroyAPIView):
    queryset = Ad.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        ad = super().get_object()
        if ad.user != self.request.user:
            raise PermissionDenied("Вы не можете удалять чужое объявление.")
        return ad
    

class AdDetailView(generics.RetrieveAPIView):
    queryset = Ad.objects.all()
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAuthenticated]



class ExchangeOfferCreateView(generics.CreateAPIView):
    queryset = ExchangeOffer.objects.all()
    serializer_class = ExchangeOfferSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        try:
            ad_sender = Ad.objects.get(id=data['ad_sender_id'])
            ad_receiver = Ad.objects.get(id=data['ad_receiver_id'])
        except Ad.DoesNotExist:
            return Response({"detail": "Одно из объявлений не найдено"}, status=status.HTTP_400_BAD_REQUEST)

        data['user_sender_id'] = ad_sender.user.id
        data['user_receiver_id'] = ad_receiver.user.id

        data['status'] = 'pending'

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SentExchangeOffersView(generics.ListAPIView):
    serializer_class = ExchangeOfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExchangeOffer.objects.filter(user_sender=self.request.user).order_by('-created_at')

class ReceivedExchangeOffersView(generics.ListAPIView):
    serializer_class = ExchangeOfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExchangeOffer.objects.filter(user_receiver=self.request.user).order_by('-created_at')

from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

class ExchangeOfferRespondView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, offer_id):
        offer = get_object_or_404(ExchangeOffer, id=offer_id, user_receiver=request.user)
        status_value = request.data.get('status')

        if status_value not in ('accepted', 'declined'):
            return Response({'detail': 'Неверный статус'}, status=status.HTTP_400_BAD_REQUEST)

        if status_value == 'declined':
            offer.delete()
            return Response({'detail': 'Предложение отклонено и удалено'})

        # accepted — меняем владельцев объявлений местами
        old_user = offer.ad_sender.user
        offer.ad_sender.user = offer.ad_receiver.user
        offer.ad_receiver.user = old_user

        offer.ad_sender.save()
        offer.ad_receiver.save()

        offer.status = 'accepted'
        offer.save()

        return Response({'detail': 'Обмен принят, владельцы обновлены'})


class FilteredAdsListView(generics.ListAPIView):
    serializer_class = AdSerializer
    permission_classes = []

    def get_queryset(self):
        queryset = Ad.objects.all()
        category = self.request.query_params.get('category')
        condition = self.request.query_params.get('condition')

        if category:
            queryset = queryset.filter(category=category)
        if condition in ('new', 'used'):
            queryset = queryset.filter(condition=condition)

        return queryset

