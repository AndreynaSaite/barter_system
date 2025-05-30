from django.contrib import admin
from django.urls import path, include
from django.shortcuts import render

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/', include('accounts.urls')),

    path('', lambda request: render(request, 'home.html'), name='home'),
    path('login/', lambda request: render(request, 'login.html'), name='login_page'),
    path('register/', lambda request: render(request, 'register.html'), name='register_page'),

    path('ads/', include('ads.urls')),
]
