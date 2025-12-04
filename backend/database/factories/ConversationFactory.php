<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Conversation>
 */
class ConversationFactory extends Factory
{
    protected $model = Conversation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $customer = User::query()->inRandomOrder()->first();

        return [
            'customer_id' => $customer?->id ?? User::factory(),
            'agent_id' => null,
            'subject' => $this->faker->sentence(3),
            'status' => $this->faker->randomElement(['open', 'pending', 'closed']),
            'last_message_at' => now(),
        ];
    }
}
