from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Task

User = get_user_model()

class TaskAPITests(APITestCase):
    def setUp(self):
        self.u1 = User.objects.create_user(username="u1", password="pass123")
        self.u2 = User.objects.create_user(username="u2", password="pass123")
        self.u3 = User.objects.create_user(username="u3", password="pass123")

        self.t1 = Task.objects.create(
            title="t1",
            created_by=self.u1,
            assigned_to=self.u2,
            done=False,
        )
        self.t2 = Task.objects.create(
            title="t2",
            created_by=self.u2,
            assigned_to=None,
            done=True,
        )

    def auth(self, user):
        self.client.force_authenticate(user=user)

    def test_register_creates_user(self):
        res = self.client.post("/api/auth/register/", {"username": "new", "password": "pw"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="new").exists())

    def test_register_requires_username_and_password(self):
        res = self.client.post("/api/auth/register/", {"username": ""}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_obtain_pair_returns_tokens(self):
        res = self.client.post("/api/auth/token/", {"username": "u1", "password": "pass123"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_task_list_filters_by_creator_or_assignee(self):
        self.auth(self.u1)
        res = self.client.get("/api/tasks/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = [t["id"] for t in res.data]
        self.assertIn(str(self.t1.id), ids)
        self.assertNotIn(str(self.t2.id), ids)

    def test_create_sets_created_by(self):
        self.auth(self.u1)
        payload = {"title": "new task", "assigned_to_id": self.u2.id}
        res = self.client.post("/api/tasks/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        task = Task.objects.get(id=res.data["id"])
        self.assertEqual(task.created_by, self.u1)
        self.assertEqual(task.assigned_to, self.u2)

    def test_toggle_flips_done_flag(self):
        self.auth(self.u2)
        res = self.client.post(f"/api/tasks/{self.t2.id}/toggle/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.t2.refresh_from_db()
        self.assertFalse(self.t2.done)

    def test_user_cannot_access_foreign_task(self):
        self.auth(self.u3)
        res = self.client.get(f"/api/tasks/{self.t1.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_users_list_requires_auth(self):
        res = self.client.get("/api/users/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.auth(self.u1)
        res = self.client.get("/api/users/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        usernames = [u["username"] for u in res.data]
        self.assertEqual(usernames, sorted(usernames))

    def test_serializer_exposes_usernames(self):
        self.auth(self.u1)
        res = self.client.get("/api/tasks/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        task = res.data[0]
        self.assertIn("created_by_username", task)
        self.assertIn("assigned_to_username", task)

    def test_assignee_can_update_task(self):
        self.auth(self.u2)
        res = self.client.patch(f"/api/tasks/{self.t1.id}/", {"title": "updated"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.t1.refresh_from_db()
        self.assertEqual(self.t1.title, "updated")
