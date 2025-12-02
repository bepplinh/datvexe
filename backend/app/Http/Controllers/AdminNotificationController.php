<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AdminNotification;
use App\Services\Admin\AdminNotificationService;

class AdminNotificationController extends Controller
{
    public function __construct(
        private AdminNotificationService $adminNotificationService
    ) {}

    public function index(Request $request)
    {
        $query = AdminNotification::query()->latest();

        // Filter by read status
        if ($request->has('is_read')) {
            $isRead = filter_var($request->input('is_read'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_read', $isRead);
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        // Search by title or message
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $limit = $request->integer('limit', 20);
        $page = $request->integer('page', 1);

        $notifications = $query->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'data' => $notifications->items(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
            'unread_count' => AdminNotification::where('is_read', false)->count(),
        ]);
    }

    public function markAsRead(AdminNotification $notification)
    {
        $notification = $this->adminNotificationService->markAsRead($notification);

        return response()->json(['data' => $notification]);
    }

    public function markAllAsRead()
    {
        AdminNotification::where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json(['success' => true]);
    }

    public function markAsUnread(AdminNotification $notification)
    {
        $notification->update([
            'is_read' => false,
            'read_at' => null,
        ]);

        return response()->json(['data' => $notification]);
    }
}
