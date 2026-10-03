from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Card
from .serializers import CardSerializer, CardCreateSerializer
from accounts.models import AdminLog


def log_action(user, action, description='', ip=None):
    AdminLog.objects.create(user=user, action=action, description=description, ip_address=ip)


def get_ip(request):
    x_forward = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_forward.split(',')[0] if x_forward else request.META.get('REMOTE_ADDR')


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def card_list_create(request):
    """List all cards for user or add a new card - Module 2"""
    if request.method == 'GET':
        cards = Card.objects.filter(user=request.user)
        serializer = CardSerializer(cards, many=True)
        return Response({'cards': serializer.data, 'count': cards.count()})

    elif request.method == 'POST':
        serializer = CardCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            card = serializer.save()
            log_action(request.user, 'CARD_ADD',
                       f'Card added: {card.masked_card_number}', get_ip(request))
            return Response({
                'message': 'Card added successfully',
                'card': CardSerializer(card).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def card_detail_delete(request, card_id):
    """Get or delete a specific card - Module 2"""
    card = get_object_or_404(Card, id=card_id, user=request.user)

    if request.method == 'GET':
        return Response(CardSerializer(card).data)

    elif request.method == 'DELETE':
        masked = card.masked_card_number
        card.delete()
        log_action(request.user, 'CARD_DELETE',
                   f'Card deleted: {masked}', get_ip(request))
        return Response({'message': 'Card deleted successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_default_card(request, card_id):
    """Set a card as default"""
    card = get_object_or_404(Card, id=card_id, user=request.user)
    Card.objects.filter(user=request.user, is_default=True).update(is_default=False)
    card.is_default = True
    card.save()
    return Response({'message': f'Card {card.masked_card_number} set as default'})
