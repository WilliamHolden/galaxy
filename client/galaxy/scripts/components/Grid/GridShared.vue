<template>
    <div>
        <div><br/><h2> {{ plural }} shared with you by others </h2></div>
        <table v-if="shared_by_others.length > 0" >
            <tr class="header">
                <th>Title</th>
                <th>Owner</th>
            </tr>
            <tr v-for="(shared_item, index) in shared_by_others" :key="index">
                <td>
                    <a :href="`{{ displayURL }}?username={{ shared_item.username }}&slug={{ shared_item.slug }}`" > {{ shared_item.title }}</a>
                </td>
                <td>
                     {{ shared_item.username }}
                </td>
            </tr>
        </table>
        <p v-else >
            No {{ plural }} have been shared with you.
        </p>
    </div>
</template>

<script>
    import $ from "jquery";
    import Backbone from "backbone";
    import { getAppRoot } from "onload/loadConfig";
    import { getGalaxyInstance } from "app";
    import GridView from "mvc/grid/grid-view";
    import axios from "axios";

    export default {
        data() {
            return {
                shared_by_others: [],
                displayURL: `${getAppRoot() + this.item}/display_by_username_and_slug`
            }
        },
        props: {
            action_id: {
                type: String
            },
            plural: {
                type: String
            },
            item: {
                type: String
            },
            active_tab: {
                type: String
            },
        },
        created() {
            const Galaxy = getGalaxyInstance();
            console.log("MADEITTTTT");
            console.log(`${$.param(Galaxy.params)}`);
            axios.get(`${getAppRoot()}${this.item}/${this.action_id}?${$.param(Galaxy.params)}`).then(response => {
                console.log("RESSSS");
                console.log(`${$.param(Galaxy.params)}`);
                console.log(response);

                this.shared_by_others = response.data.shared_by_others || [];
                console.log(this.$props);
                const gridModel = new Backbone.Model(this.$props);
                gridModel.set(response);
                console.log(gridModel.attributes);
                const gridView = new GridView(gridModel.attributes);
                this.$el.append(gridView.$el); /*TODO Prepend? */
            });
            console.log("DONE");
        },

        methods: {
        },
    };
</script>
