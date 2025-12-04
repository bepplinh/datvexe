<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Message>
 */
class MessageFactory extends Factory
{
    protected $model = Message::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $conversation = Conversation::query()->inRandomOrder()->first();
        $sender = User::query()->inRandomOrder()->first();

        return [
            'conversation_id' => $conversation?->id ?? Conversation::factory(),
            'sender_id' => $sender?->id ?? User::factory(),
            'content' => $this->faker->sentence(),
            'metadata' => null,
            'message_type' => 'text',
            'delivery_status' => 'sent',
            'delivered_at' => now(),
            'read_at' => $this->faker->boolean(70) ? now() : null,
        ];
    }
}
