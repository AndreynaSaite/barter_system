from rest_framework import serializers
from .models import Ad, ExchangeOffer
from accounts.models import CustomUser

class AdSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ad
        fields = ['id', 'user', 'title', 'description', 'image_url', 'category', 'condition', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']



class ExchangeOfferSerializer(serializers.ModelSerializer):
    ad_sender = AdSerializer(read_only=True)
    ad_receiver = AdSerializer(read_only=True)
    ad_sender_id = serializers.PrimaryKeyRelatedField(queryset=Ad.objects.all(), source='ad_sender', write_only=True)
    ad_receiver_id = serializers.PrimaryKeyRelatedField(queryset=Ad.objects.all(), source='ad_receiver', write_only=True)

    user_sender_id = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), source='user_sender', write_only=True)
    user_receiver_id = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all(), source='user_receiver', write_only=True)

    class Meta:
        model = ExchangeOffer
        fields = [
            'id',
            'ad_sender_id', 'ad_receiver_id',
            'user_sender_id', 'user_receiver_id',
            'ad_sender', 'ad_receiver',
            'user_sender', 'user_receiver',
            'comment',
            'status',
            'created_at',
        ]
        read_only_fields = (
            'id', 'status', 'created_at',
            'ad_sender', 'ad_receiver',
            'user_sender', 'user_receiver',
        )



