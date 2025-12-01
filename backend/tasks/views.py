from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Task
from .serializers import TaskSerializer
from .permissions import IsOwnerOrAssignee

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAssignee]

    def get_queryset(self):
        # ⚠️ pomembno: filtremo po *_id, ne po User objektih (ker je User v drugi bazi)
        uid = self.request.user.id
        return Task.objects.filter(
            models.Q(created_by_id=uid) | models.Q(assigned_to_id=uid)
        ).order_by("-created_at")

    def perform_create(self, serializer):
        # zapisujemo po *_id, da ne delamo cross-DB hopov
        serializer.save(created_by_id=self.request.user.id)

    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):
        task = self.get_object()
        task.done = not task.done
        task.save(update_fields=["done"])
        return Response(self.get_serializer(task).data)
