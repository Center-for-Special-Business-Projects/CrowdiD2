import _ from 'lodash';
import { actionDeleteRelation } from './delete_relation';


// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteWayAction.as
export function actionDeleteWay(wayId) {


    function canDeleteNode(node, graph) {
        return !graph.parentWays(node).length &&
            !graph.parentRelations(node).length &&
            !node.hasInterestingTags();
    }


    var action = function(graph) {
        var way = graph.entity(wayId);

        graph.parentRelations(way)
            .forEach(function(parent) {
                parent = parent.removeMembersWithID(wayId);
                graph = graph.replace(parent);

                if (parent.isDegenerate()) {
                    graph = actionDeleteRelation(parent.id)(graph);
                }
            });

        _.uniq(way.nodes).forEach(function(nodeId) {
            graph = graph.replace(way.removeNode(nodeId));

            var node = graph.entity(nodeId);
            if (canDeleteNode(node, graph)) {
                graph = graph.remove(node);
            }
        });

        return graph.remove(way);
    };


    action.disabled = function(graph) {
        var disabled = false;

        graph.parentRelations(graph.entity(wayId)).forEach(function(parent) {
            var type = parent.tags.type,
                role = parent.memberById(wayId).role || 'outer';
            if (type === 'route' || type === 'boundary' || (type === 'multipolygon' && role === 'outer')) {
                disabled = 'part_of_relation';
            }
        });

        return disabled;
    };


    return action;
}
