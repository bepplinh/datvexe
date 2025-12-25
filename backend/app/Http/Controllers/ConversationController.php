<?php

namespace App\Http\Controllers;

use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Events\ConversationCreated;
use App\Events\MessageCreated;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConversationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Conversation::query()
            ->with(['customer', 'agent', 'lastMessage.sender'])
            ->withCount('messages')
            ->when($status = $request->query('status'), function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->when($search = $request->query('q'), function ($q) use ($search) {
                $q->whereHas('customer', function ($sub) use ($search) {
                    $sub->where('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            });

        if ($user->role === 'admin') {
            if ($request->boolean('only_assigned')) {
                $query->where('agent_id', $user->id);
            }
        } else {
            $query->where('customer_id', $user->id);
        }

        $conversations = $query
            ->orderByDesc(DB::raw('COALESCE(last_message_at, created_at)'))
            ->paginate($request->integer('per_page', 20));

        return response()->json(ConversationResource::collection($conversations));
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'customer_id' => ['nullable', 'exists:users,id'],
            'agent_id' => ['nullable', 'exists:users,id'],
            'subject' => ['nullable', 'string', 'max:255'],
        ]);

        $customerId = $user->role === 'admin'
            ? ($data['customer_id'] ?? null)
            : $user->id;

        if (!$customerId) {
            return response()->json([
                'message' => 'customer_id is required for admin initiated conversations.',
            ], 422);
        }

        $conversation = Conversation::create([
            'customer_id' => $customerId,
            'agent_id' => $data['agent_id'] ?? ($user->role === 'admin' ? $user->id : null),
            'subject' => $data['subject'] ?? null,
            'status' => 'open',
            'last_message_at' => now(),
        ]);

        broadcast(new ConversationCreated($conversation))->toOthers();

        return response()->json(new ConversationResource($conversation->load(['customer', 'agent'])), 201);
    }

    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request->user(), $conversation);

        $conversation->load([
            'customer',
            'agent',
            'messages' => function ($query) {
                $query->with('sender')->orderBy('created_at');
            },
        ]);

        return response()->json(new ConversationResource($conversation));
    }

    public function storeMessage(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request->user(), $conversation);

        $validated = $request->validate([
            'content' => ['required', 'string'],
            'message_type' => ['nullable', 'in:text,image,file,note'],
            'metadata' => ['nullable', 'array'],
        ]);

        $message = $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'content' => $validated['content'],
            'message_type' => $validated['message_type'] ?? 'text',
            'metadata' => $validated['metadata'] ?? null,
            'delivery_status' => 'sent',
        ]);

        $conversation->forceFill([
            'last_message_at' => now(),
            'agent_id' => $conversation->agent_id ?? ($request->user()->role === 'admin' ? $request->user()->id : $conversation->agent_id),
        ])->save();

        broadcast(new MessageCreated($message))->toOthers();

        return response()->json(new MessageResource($message->load('sender')), 201);
    }

    public function updateStatus(Request $request, Conversation $conversation): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            abort(403, 'Only admin can update status');
        }

        $validated = $request->validate([
            'status' => ['required', 'in:open,pending,closed'],
            'agent_id' => ['nullable', 'exists:users,id'],
        ]);

        $conversation->update([
            'status' => $validated['status'],
            'agent_id' => $validated['agent_id'] ?? $conversation->agent_id,
        ]);

        return response()->json(new ConversationResource($conversation->fresh(['customer', 'agent'])));
    }

    protected function authorizeConversation($user, Conversation $conversation): void
    {
        $isParticipant = $conversation->customer_id === $user->id
            || $conversation->agent_id === $user->id
            || $user->role === 'admin';

        abort_unless($isParticipant, 403, 'You are not authorized to access this conversation.');
    }
}
