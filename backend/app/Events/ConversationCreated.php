<?php

namespace App\Events;

use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\InteractsWithSockets;

class ConversationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Conversation $conversation)
    {
        $this->conversation->loadMissing(['customer', 'agent', 'lastMessage.sender']);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.conversations'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ConversationCreated';
    }

    public function broadcastWith(): array
    {
        return (new ConversationResource($this->conversation))->toArray(request());
    }
}

