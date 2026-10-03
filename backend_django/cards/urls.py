from django.urls import path
from . import views

urlpatterns = [
    path('', views.card_list_create, name='card-list-create'),
    path('<int:card_id>/', views.card_detail_delete, name='card-detail-delete'),
    path('<int:card_id>/set-default/', views.set_default_card, name='set-default-card'),
]
