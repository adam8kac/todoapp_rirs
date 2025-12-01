from rest_framework.permissions import BasePermission

class IsOwnerOrAssignee(BasePermission):
    def has_object_permission(self, request, view, obj):
        return (obj.created_by_id == request.user.id) or (obj.assigned_to_id == request.user.id)
