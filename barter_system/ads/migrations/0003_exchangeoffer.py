# Generated by Django 5.2.1 on 2025-05-30 07:51

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ads', '0002_alter_ad_condition'),
    ]

    operations = [
        migrations.CreateModel(
            name='ExchangeOffer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('comment', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('pending', 'Ожидает'), ('accepted', 'Принята'), ('declined', 'Отклонена')], default='pending', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('ad_receiver', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_offers', to='ads.ad')),
                ('ad_sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_offers', to='ads.ad')),
            ],
        ),
    ]
