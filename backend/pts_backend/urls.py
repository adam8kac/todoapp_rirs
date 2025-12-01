# backend/pts_backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
import json

from rest_framework.routers import DefaultRouter
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from tasks.views import TaskViewSet

User = get_user_model()

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")


@csrf_exempt
def register(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    try:
        data = json.loads((request.body or b"{}").decode())
    except json.JSONDecodeError:
        return JsonResponse({"detail": "invalid JSON"}, status=400)

    u = data.get("username")
    p = data.get("password")
    if not u or not p:
        return JsonResponse({"detail": "username and password required"}, status=400)

    # preveri v Postgresu (privzeta baza)
    if User.objects.filter(username=u).exists():
        return JsonResponse({"detail": "username taken"}, status=400)

    # ustvari uporabnika v privzeti bazi
    user = User.objects.create_user(username=u, password=p)
    return JsonResponse({"id": user.id, "username": user.username}, status=201)


class UsersList(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = list(
            User.objects.order_by("username").values("id", "username")
        )
        return Response(data)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(router.urls)),
    path("api/users/", UsersList.as_view()),                  
    path("api/auth/register/", register),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
