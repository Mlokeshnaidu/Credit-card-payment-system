from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Card
from .serializers import CardSerializer, CardCreateSerializer
from accounts.models import AdminLog


def log_action(user, action, description='', ip=None, target_type='Card', target_id=None):
    actor_role = getattr(user, 'role', 'CUSTOMER') if user else 'ANONYMOUS'
    AdminLog.objects.create(
        user=user,
        actor_role=actor_role,
        action=action,
        description=description,
        target_type=target_type,
        target_id=str(target_id) if target_id else None,
        ip_address=ip
    )


def get_ip(request):
    x_forward = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_forward.split(',')[0].strip() if x_forward else request.META.get('REMOTE_ADDR')


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def card_list_create(request):
    """List all cards for user or add a new card - Module 2 & RBAC applied"""
    if request.method == 'GET':
        # Support or Admin can view a specified user's cards with ?user_id=
        user_id = request.query_params.get('user_id')
        if user_id and (request.user.is_admin_role() or request.user.is_support_role()):
            cards = Card.objects.filter(user_id=user_id)
        else:
            cards = Card.objects.filter(user=request.user)
        serializer = CardSerializer(cards, many=True)
        return Response({'cards': serializer.data, 'count': cards.count()})

    elif request.method == 'POST':
        # RBAC Check: Read-Only role cannot add cards
        if getattr(request.user, 'role', None) == 'READ_ONLY':
            return Response(
                {'error': 'Read-Only role is not permitted to perform card modifications.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CardCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            card = serializer.save()
            log_action(
                request.user, 'CARD_ADD',
                f'Card added: {card.masked_card_number} by {request.user.email}',
                get_ip(request),
                target_type='Card',
                target_id=card.id
            )
            return Response({
                'message': 'Card added successfully',
                'card': CardSerializer(card).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def card_detail_delete(request, card_id):
    """Get or delete a specific card - Module 2 & RBAC applied"""
    # Card owner or Admin/Support can access card detail
    if request.user.is_admin_role() or request.user.is_support_role():
        card = get_object_or_404(Card, id=card_id)
    else:
        card = get_object_or_404(Card, id=card_id, user=request.user)

    if request.method == 'GET':
        return Response(CardSerializer(card).data)

    elif request.method == 'DELETE':
        # RBAC Check: Read-Only and Support roles cannot delete cards; only owner or Admin can delete
        if getattr(request.user, 'role', None) in ['READ_ONLY', 'SUPPORT'] and card.user != request.user:
            return Response(
                {'error': 'Support and Read-Only roles are not permitted to delete cards.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if getattr(request.user, 'role', None) == 'READ_ONLY':
            return Response(
                {'error': 'Read-Only users are not permitted to delete cards.'},
                status=status.HTTP_403_FORBIDDEN
            )

        masked = card.masked_card_number
        cid = card.id
        card.delete()
        log_action(
            request.user, 'CARD_DELETE',
            f'Card deleted: {masked} by {request.user.email}',
            get_ip(request),
            target_type='Card',
            target_id=cid
        )
        return Response({'message': 'Card deleted successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_default_card(request, card_id):
    """Set a card as default"""
    if getattr(request.user, 'role', None) == 'READ_ONLY':
        return Response(
            {'error': 'Read-Only users cannot change default cards.'},
            status=status.HTTP_403_FORBIDDEN
        )

    card = get_object_or_404(Card, id=card_id, user=request.user)
    Card.objects.filter(user=request.user, is_default=True).update(is_default=False)
    card.is_default = True
    card.save()
    return Response({'message': f'Card {card.masked_card_number} set as default'})
