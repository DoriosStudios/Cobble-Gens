import { ItemStack } from "@minecraft/server"
import * as DoriosLib from "DoriosLib/index.js"

const OUTPUT_OFFSETS = {
    up: [0, -1, 0],
    down: [0, 1, 0],
    north: [0, 0, 1],
    south: [0, 0, -1],
    west: [1, 0, 0],
    east: [-1, 0, 0]
}

const INPUT_FACES = {
    up: "up",
    down: "down",
    north: "south",
    south: "north",
    west: "west",
    east: "east"
}

DoriosLib.registry.blockComponent("utilitycraft:block_generator", {
    onTick({ block, dimension }, { params }) {
        const amount = Math.max(1, Math.floor(params?.amount ?? 1))
        const material = params?.material ?? "minecraft:cobblestone"
        const facing = DoriosLib.block.getState(block, "minecraft:facing_direction")
        const offset = OUTPUT_OFFSETS[facing]

        if (!offset) return

        const targetLocation = {
            x: block.location.x + offset[0],
            y: block.location.y + offset[1],
            z: block.location.z + offset[2]
        }

        const e0 = DoriosLib.block.getState(block, "utilitycraft:e0") ?? 0
        const e1 = DoriosLib.block.getState(block, "utilitycraft:e1") ?? 0
        const storedAmount = e1 * 10 + e0
        const availableAmount = Math.min(64, storedAmount + amount)

        let insertedAmount = 0
        try {
            const target = DoriosLib.container.resolveAt(dimension, targetLocation)
            if (target) {
                insertedAmount = DoriosLib.container.insert(target, {
                    item: new ItemStack(material, availableAmount),
                    face: INPUT_FACES[facing]
                })
            }
        } catch {
            insertedAmount = 0
        }

        const remainder = Math.max(0, availableAmount - insertedAmount)
        DoriosLib.block.setState(block, "utilitycraft:e0", remainder % 10)
        DoriosLib.block.setState(block, "utilitycraft:e1", Math.floor(remainder / 10))
    },

    onPlayerInteract({ block, player }, { params }) {
        const e0 = DoriosLib.block.getState(block, "utilitycraft:e0") ?? 0
        const e1 = DoriosLib.block.getState(block, "utilitycraft:e1") ?? 0
        const storedAmount = e1 * 10 + e0

        if (storedAmount <= 0 || player.getComponent("equippable")?.getEquipment("Mainhand")) return

        DoriosLib.player.giveItem(player, {
            item: params?.material ?? "minecraft:cobblestone",
            amount: storedAmount
        })
        DoriosLib.block.setState(block, "utilitycraft:e0", 0)
        DoriosLib.block.setState(block, "utilitycraft:e1", 0)
    }
})
