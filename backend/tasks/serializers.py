from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)
    created_by_id  = serializers.IntegerField(read_only=True)

    assigned_to_username = serializers.SerializerMethodField()
    created_by_username  = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id", "title", "description",
            "assigned_to_id", "assigned_to_username",
            "created_by_id", "created_by_username",
            "due_date", "done", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by_id", "created_by_username", "created_at", "updated_at"]

    def get_assigned_to_username(self, obj):
        if not obj.assigned_to_id:
            return None
        return getattr(obj.assigned_to, "username", None)

    def get_created_by_username(self, obj):
        return getattr(obj.created_by, "username", None)
